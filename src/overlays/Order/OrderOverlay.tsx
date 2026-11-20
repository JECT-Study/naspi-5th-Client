import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetKeys, assetQueries } from '@/apis/domains/asset/asset.queries';
import type { MyAssets } from '@/apis/domains/asset/asset.types';
import { orderKeys } from '@/apis/domains/order/order.queries';
import { createOrder } from '@/apis/domains/order/order.service';
import type {
  CreateOrderRequest,
  OrderErrorCode,
  OrderSide,
  OrderType,
} from '@/apis/domains/order/order.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import {
  MIN_OWN_HOLDING,
  PRICE_TICK,
  ceilToTick,
  estimateMarketAmount,
  floorToTick,
  getMaxLimitBuyQuantity,
  getMaxMarketBuyQuantity,
} from '@/apis/domains/order/order.utils';
import {
  ORDER_CORRECTION_DELAY_MS,
  ORDER_MESSAGES,
  getPriceLimitError,
  isOrderFilled,
} from '@/apis/domains/order/order.validation';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import type { StockDetail, StockId } from '@/apis/domains/stock/stock.types';
import Button from '@/components/ui/Button';
import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import LoadError from '@/components/status/LoadError';
import TaskHeader from '@/components/header/TaskHeader';
import { useCloseOverlay } from '@/hooks/useOverlay';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';
import { cn } from '@/utils/cn';
import { formatNumber, formatRate } from '@/utils/format';
import { getPriceColorClass } from '@/components/stock/priceColor';
import NumberField from './components/NumberField';
import NumericKeypad from './components/NumericKeypad';
import SellableBreakdown from './components/SellableBreakdown';
import { applyKeypadKey, type KeypadKey } from './components/keypad';

/** 숫자 키패드로 고치는 칸 */
type OrderField = 'price' | 'quantity';
type FieldErrors = Partial<Record<OrderField, string>>;

interface OrderOverlayProps {
  roomId: RoomId;
  stockId: StockId;
  side: OrderSide;
}

// 제목·제출 버튼은 '매수·매도', 안내 문장("원하는 가격에 구매할 수 있어요.")은 '구매·판매' (설계서 v.1.5 주문)
const SIDE_LABEL: Record<OrderSide, string> = { BUY: '매수', SELL: '매도' };
const SIDE_VERB: Record<OrderSide, string> = { BUY: '구매', SELL: '판매' };
const getOrderTitle = (stockName: string, side: OrderSide) =>
  `${stockName} ${SIDE_LABEL[side]} 주문`;
const ORDER_TYPES: { type: OrderType; label: string }[] = [
  { type: 'MARKET', label: '시장가' },
  { type: 'LIMIT', label: '지정가' },
];

interface OrderFormProps {
  roomId: RoomId;
  side: OrderSide;
  stock: StockDetail;
  assets: MyAssets;
}

// 주문 입력 규칙 (화면설계서 주문)
// - 숫자 키패드는 화면 아래에 늘 떠 있다 (시안 주문 화면 6개 모두, 디자이너 코멘트 "키패드가 아래 고정")
//   키패드가 고치는 칸은 처음에 수량. 가격 칸을 누르면 가격, 수량 칸을 누르면 수량 (시장가는 수량만)
// - 칸을 "벗어날 때" 검사한다: 다른 칸을 누를 때, 주문 버튼을 누를 때 (빈 곳을 눌러도 키패드·칸은 그대로)
// - 지정가 가격: 100원 단위로 올림. 상한가·하한가를 벗어나면 오류를 1초 보여 준 뒤 현재가로 되돌린다 (5, 5-1, 5-2)
// - 수량: 비었거나 0이면 "수량을 입력해 주세요." (3-1, 6). 현금·주식이 모자라면 오류를 1초 보여 준 뒤 최대 수량으로 바꾼다 (7, 8)
// - 지정가 구매는 가격 칸을 벗어날 때도 현금을 검사한다 (7). 오류는 값을 다시 고치면 바로 사라진다
function OrderForm({ roomId, side, stock, assets }: OrderFormProps) {
  const queryClient = useQueryClient();
  const closeOverlay = useCloseOverlay();
  const { stockId } = stock;
  const sideLabel = SIDE_LABEL[side];
  const sideVerb = SIDE_VERB[side];

  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  // 지정가는 오버레이를 처음 열 때의 현재가로 시작한다 (주문 5)
  const [limitPrice, setLimitPrice] = useState(stock.price);
  const [quantity, setQuantity] = useState(0);
  // 값을 고칠 때까지 남는 오류 (수량 미입력, 서버가 거절한 현금·주식 부족)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // 1초 보여 준 뒤 값을 고치는 오류
  const [flashError, setFlashError] = useState<{ field: OrderField; message: string } | null>(null);
  const correctionTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 숫자 키패드가 고치는 칸. 처음에는 수량 (시장가는 고칠 칸이 수량뿐, 지정가 가격은 현재가로 채워져 있다)
  const [activeField, setActiveField] = useState<OrderField>('quantity');

  // 1초 뒤 되돌릴 "현재가"는 그때의 실시간 현재가
  const latestPriceRef = useRef(stock.price);
  useEffect(() => {
    latestPriceRef.current = stock.price;
  });
  useEffect(() => () => clearTimeout(correctionTimerRef.current), []);

  const holding = assets.holdings.find((item) => item.stockId === stock.stockId);
  const isLimit = orderType === 'LIMIT';
  // 시장가는 가격 칸이 없어 늘 수량
  const keypadTarget: OrderField = isLimit ? activeField : 'quantity';
  const getError = (field: OrderField) =>
    flashError?.field === field ? flashError.message : fieldErrors[field];

  const { mutate, isPending } = useMutation({
    mutationFn: (request: CreateOrderRequest) => createOrder(roomId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.room(roomId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.room(roomId) });
      // 공통 5-3: 확인하기 → 종목 - 내 주식
      notify.success('주문이 접수됐어요.', {
        link: { label: '확인하기', to: `/leagues/${roomId}/stocks/${stockId}/mine` },
      });
      closeOverlay();
    },
    // 서버가 현금·주식 부족으로 거절하면 수량 칸에 안내하고, 그 밖의 실패는 공통 토스트 (libs/queryClient)
    meta: {
      action: '주문 접수',
      handledErrors: ['INSUFFICIENT_CASH', 'INSUFFICIENT_SHARES'] satisfies OrderErrorCode[],
    },
    onError: (error) => {
      const code = getApiErrorCode(error) as OrderErrorCode | undefined;
      if (code === 'INSUFFICIENT_CASH') {
        setFieldErrors({ quantity: ORDER_MESSAGES.cashShortage });
      } else if (code === 'INSUFFICIENT_SHARES') {
        setFieldErrors({ quantity: ORDER_MESSAGES.sharesShortage });
      }
    },
  });

  const cancelCorrection = () => {
    clearTimeout(correctionTimerRef.current);
    setFlashError(null);
  };

  // 오류를 1초 보여 준 뒤 사라지게 하고 값을 고친다
  const scheduleCorrection = (field: OrderField, message: string, correct: () => void) => {
    clearTimeout(correctionTimerRef.current);
    setFlashError({ field, message });
    correctionTimerRef.current = setTimeout(() => {
      setFlashError(null);
      correct();
    }, ORDER_CORRECTION_DELAY_MS);
  };

  // 입력값이 바뀌면 그 칸의 오류는 바로 사라진다
  const changeLimitPrice = (price: number) => {
    cancelCorrection();
    setLimitPrice(price);
    setFieldErrors((prev) => ({ ...prev, price: undefined }));
  };

  const changeQuantity = (next: number) => {
    cancelCorrection();
    setQuantity(next);
    setFieldErrors((prev) => ({ ...prev, quantity: undefined }));
  };

  /** 수량 검사. 통과하면 true. price는 지정가 구매의 1주 가격 */
  const checkQuantity = (price: number, { requireQuantity }: { requireQuantity: boolean }) => {
    if (quantity <= 0) {
      if (requireQuantity)
        setFieldErrors((prev) => ({ ...prev, quantity: ORDER_MESSAGES.quantityEmpty }));
      return false;
    }
    let maxQuantity = holding?.sellableQuantity ?? 0;
    if (side === 'BUY') {
      maxQuantity = isLimit
        ? getMaxLimitBuyQuantity(price, assets.availableCash)
        : getMaxMarketBuyQuantity(stock, assets.availableCash);
    }
    if (quantity <= maxQuantity) return true;
    const message = side === 'BUY' ? ORDER_MESSAGES.cashShortage : ORDER_MESSAGES.sharesShortage;
    scheduleCorrection('quantity', message, () => setQuantity(maxQuantity));
    return false;
  };

  /** 지정가 가격 검사: 100원 단위로 올리고 상한가·하한가를 확인한다. 통과하면 맞춘 가격, 아니면 null */
  const checkLimitPrice = () => {
    const price = ceilToTick(limitPrice);
    setLimitPrice(price);
    const limitError = getPriceLimitError(price, stock);
    if (!limitError) return price;
    scheduleCorrection('price', limitError, () => setLimitPrice(latestPriceRef.current));
    return null;
  };

  // 칸을 벗어날 때 검사 (다른 칸을 누를 때)
  const leaveField = (field: OrderField) => {
    if (field === 'price') {
      const price = checkLimitPrice();
      if (price !== null && side === 'BUY' && quantity > 0) {
        checkQuantity(price, { requireQuantity: false });
      }
      return;
    }
    checkQuantity(ceilToTick(limitPrice), { requireQuantity: true });
  };

  const selectField = (field: OrderField) => {
    if (field === keypadTarget) return;
    leaveField(keypadTarget);
    setActiveField(field);
  };

  // 시장가/지정가를 바꾸면 이전 유형의 오류는 지우고 키패드는 수량 칸으로 돌린다
  const changeOrderType = (type: OrderType) => {
    cancelCorrection();
    setFieldErrors({});
    setActiveField('quantity');
    setOrderType(type);
  };

  const handleKeypadPress = (key: KeypadKey) => {
    if (keypadTarget === 'price') changeLimitPrice(applyKeypadKey(limitPrice, key));
    else changeQuantity(applyKeypadKey(quantity, key));
  };

  // 주문 버튼도 칸을 벗어나는 것으로 보고 모든 칸을 검사한 뒤, 통과하면 접수한다
  const handleSubmit = () => {
    cancelCorrection();
    let price = 0;
    if (isLimit) {
      const checked = checkLimitPrice();
      if (checked === null) return;
      price = checked;
    }
    if (!checkQuantity(price, { requireQuantity: true })) return;
    mutate({
      stockId: stock.stockId,
      side,
      type: orderType,
      quantity,
      price: isLimit ? price : undefined,
    });
  };

  // 시안 주문 실행 버튼: 매수 NSBuy, 매도 NSSell, 흰 글자, ModalShadow (못 누를 때는 기본 버튼과 같은 Grey/2)
  const orderButton = (
    <Button
      className={cn('w-full', side === 'BUY' ? 'bg-ns-buy' : 'bg-ns-sell')}
      disabled={!isOrderFilled(isLimit, limitPrice, quantity)}
      isPending={isPending}
      onClick={handleSubmit}
    >
      {sideLabel} 주문하기
    </Button>
  );

  return (
    <>
      <TaskHeader title={getOrderTitle(stock.name, side)} />
      {/* 시안 '주문 정보 콘텐츠': 위 8 → 현재가 → 시장가/지정가·안내 → 입력 폼(좌우 24, 사이 8) */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2 pb-4">
        {/* 시안 '종목 시세 영역': 위아래 2·좌우 24. "현재가" Caption1 Grey/8 / 현재가 Heading2 Grey/8 + 4 + 등락률 Body3 */}
        <section className="flex flex-col px-6 py-0.5">
          <p className="text-caption1 text-grey-8">현재가</p>
          <p className="flex items-center gap-1">
            <span className="text-heading2 text-grey-8">{formatNumber(stock.price)}원</span>
            <span className={cn('text-body3', getPriceColorClass(stock.change))}>
              {stock.change > 0 ? '+' : stock.change < 0 ? '-' : ''}
              {formatRate(stock.changeRate)}
            </span>
          </p>
        </section>

        {/* 시안 '주문 가격 유형 선택 영역': 여백 8·24·16, 사이 8
            두 칸 버튼(높이 48, 바깥 모서리 6, Button2): 선택 NSBlue 바탕 흰 글자 / 미선택 흰색 + Grey/4 테두리·글자
            아래 안내 Title4 Grey/8 */}
        <div className="flex flex-col gap-2 px-6 pt-2 pb-4">
          <div role="tablist" className="flex h-12">
            {ORDER_TYPES.map((item, index) => (
              <button
                key={item.type}
                type="button"
                role="tab"
                aria-selected={orderType === item.type}
                className={cn(
                  'flex-1 text-button2',
                  index === 0 ? 'rounded-l-md' : 'rounded-r-md',
                  orderType === item.type
                    ? 'bg-ns-blue text-white'
                    : 'bg-white text-grey-4 shadow-[inset_0_0_0_1px_var(--color-grey-4)]',
                )}
                onClick={() => changeOrderType(item.type)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-title4 text-grey-8">
            {isLimit ? '원하는 가격에' : '가장 빠른 가격에'} {sideVerb}할 수 있어요.
          </p>
        </div>

        <div className="flex flex-col gap-2 px-6">
          {/* 사용 가능한 현금: Body3, 이름 Grey/5 + 8 + 금액 Grey/8 */}
          {side === 'BUY' ? (
            <p className="flex gap-2 text-body3">
              <span className="text-grey-5">사용 가능한 현금</span>
              <span className="text-grey-8">{formatNumber(assets.availableCash)}원</span>
            </p>
          ) : (
            <SellableBreakdown holding={holding} minimumOwnHolding={MIN_OWN_HOLDING} />
          )}

          {isLimit ? (
            <NumberField
              label="1주 희망 가격"
              unit="원"
              value={limitPrice}
              error={getError('price')}
              onActivate={() => selectField('price')}
              onChange={changeLimitPrice}
              addon={
                // 100원씩 내리고 올린다. 100원 단위가 아니면 그 방향의 가장 가까운 100원 단위로 (주문 5)
                // 시안 수량조절: Minus 24 + 간격 8 + Plus 24 (Grey/8)
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="100원 내리기"
                    onClick={() =>
                      changeLimitPrice(Math.max(PRICE_TICK, ceilToTick(limitPrice) - PRICE_TICK))
                    }
                  >
                    <MinusIcon className="text-grey-8" />
                  </button>
                  <button
                    type="button"
                    aria-label="100원 올리기"
                    onClick={() => changeLimitPrice(floorToTick(limitPrice) + PRICE_TICK)}
                  >
                    <PlusIcon className="text-grey-8" />
                  </button>
                </div>
              }
            />
          ) : (
            // 시장가는 고칠 수 없는 가격 칸 (입력칸과 같은 상자, 숫자 대신 "최대한 빠른 가격")
            <div className="flex flex-col gap-1 rounded-md bg-grey-1 p-2">
              <span className="px-1 text-caption1 text-grey-5">1주 희망 가격</span>
              <p className="px-1 text-heading2 text-grey-8">최대한 빠른 가격</p>
            </div>
          )}

          <NumberField
            label="수량"
            unit="주"
            value={quantity}
            error={getError('quantity')}
            onActivate={() => selectField('quantity')}
            onChange={changeQuantity}
            hint={
              isLimit
                ? `총 ${formatNumber(limitPrice * quantity)}원`
                : // 시장가 예상 금액은 실시간 호가로 다시 계산된다 (주문 0, 3)
                  `예상 ${formatNumber(estimateMarketAmount(stock, side, quantity))}원`
            }
          />
        </div>
      </main>
      {/* 키패드와 주문 버튼은 화면 아래에 늘 붙어 있다 (시안: 키패드 아래 30 띄우고 버튼, 버튼은 아래 27·좌우 18) */}
      <footer className="flex shrink-0 flex-col bg-white">
        <NumericKeypad onPress={handleKeypadPress} />
        <div className="px-4.5 pt-7.5 pb-6.75">{orderButton}</div>
      </footer>
    </>
  );
}

// 매수 주문·매도 주문 (오버레이, 차트의 사기/팔기)
function OrderOverlay({ roomId, stockId, side }: OrderOverlayProps) {
  const stock = useQuery(stockQueries.detail(roomId, stockId));
  const assets = useQuery(assetQueries.mine(roomId));

  if (stock.data && assets.data) {
    return <OrderForm roomId={roomId} side={side} stock={stock.data} assets={assets.data} />;
  }

  const title = getOrderTitle(stock.data?.name ?? '', side);
  return (
    <>
      <TaskHeader title={title} />
      {stock.isError || assets.isError ? (
        <LoadError
          onRetry={() => {
            if (stock.isError) stock.refetch();
            if (assets.isError) assets.refetch();
          }}
        />
      ) : (
        // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체)
        <div className="mx-6 mt-4 h-60 animate-pulse rounded-md bg-grey-0" />
      )}
    </>
  );
}

export default OrderOverlay;
