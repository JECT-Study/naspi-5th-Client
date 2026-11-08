import { useEffect, useRef, useState, type MouseEvent } from 'react';
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
import Button from '@/components/Button';
import FloatingFooter from '@/components/FloatingFooter';
import LoadError from '@/components/LoadError';
import TaskHeader from '@/components/TaskHeader';
import { useCloseOverlay } from '@/hooks/useOverlay';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
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

const SIDE_LABEL: Record<OrderSide, string> = { BUY: '구매', SELL: '판매' };
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
// - 숫자 키패드는 가격·수량 칸을 눌렀을 때만 올라오고, 칸 밖(빈 곳)을 누르면 내려간다
// - 칸을 "벗어날 때" 검사한다: 다른 칸을 누를 때, 칸 밖을 눌러 키패드가 내려갈 때, 주문 버튼을 누를 때
// - 지정가 가격: 100원 단위로 올림. 상한가·하한가를 벗어나면 오류를 1초 보여 준 뒤 현재가로 되돌린다 (5, 5-1, 5-2)
// - 수량: 비었거나 0이면 "수량을 입력해 주세요." (3-1, 6). 현금·주식이 모자라면 오류를 1초 보여 준 뒤 최대 수량으로 바꾼다 (7, 8)
// - 지정가 구매는 가격 칸을 벗어날 때도 현금을 검사한다 (7). 오류는 값을 다시 고치면 바로 사라진다
function OrderForm({ roomId, side, stock, assets }: OrderFormProps) {
  const queryClient = useQueryClient();
  const closeOverlay = useCloseOverlay();
  const { stockId } = stock;
  const sideLabel = SIDE_LABEL[side];

  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  // 지정가는 오버레이를 처음 열 때의 현재가로 시작한다 (주문 5)
  const [limitPrice, setLimitPrice] = useState(stock.price);
  const [quantity, setQuantity] = useState(0);
  // 값을 고칠 때까지 남는 오류 (수량 미입력, 서버가 거절한 현금·주식 부족)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // 1초 보여 준 뒤 값을 고치는 오류
  const [flashError, setFlashError] = useState<{ field: OrderField; message: string } | null>(null);
  const correctionTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 숫자 키패드가 고치는 칸. null이면 키패드를 내린다 (처음에는 내려 둔다)
  const [activeField, setActiveField] = useState<OrderField | null>(null);

  // 1초 뒤 되돌릴 "현재가"는 그때의 실시간 현재가
  const latestPriceRef = useRef(stock.price);
  useEffect(() => {
    latestPriceRef.current = stock.price;
  });
  useEffect(() => () => clearTimeout(correctionTimerRef.current), []);

  const holding = assets.holdings.find((item) => item.stockId === stock.stockId);
  const isLimit = orderType === 'LIMIT';
  // 시장가는 가격 칸이 없다
  const keypadTarget: OrderField | null = !isLimit && activeField === 'price' ? null : activeField;
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

  // 칸을 벗어날 때 검사 (다른 칸을 누르거나 칸 밖을 눌렀을 때)
  const leaveField = (field: OrderField | null) => {
    if (field === null) return;
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

  // 칸 밖(빈 곳)을 누르면 키패드를 내린다. 칸·버튼·탭을 누른 건 각자 처리한다
  const handleMainClick = (event: MouseEvent<HTMLElement>) => {
    if (keypadTarget === null) return;
    if ((event.target as HTMLElement).closest('[data-keypad-field], button, [role="tab"]')) return;
    leaveField(keypadTarget);
    setActiveField(null);
  };

  // 시장가/지정가를 바꾸면 이전 유형의 오류는 지우고 키패드를 내린다
  const changeOrderType = (type: OrderType) => {
    cancelCorrection();
    setFieldErrors({});
    setActiveField(null);
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

  const orderButton = (
    <Button
      className="w-full"
      disabled={!isOrderFilled(isLimit, limitPrice, quantity)}
      isPending={isPending}
      onClick={handleSubmit}
    >
      {sideLabel}하기
    </Button>
  );

  return (
    <>
      <TaskHeader title={`${stock.name} ${sideLabel}하기`} />
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-9 pt-2',
          keypadTarget && 'pb-4',
        )}
        onClick={handleMainClick}
      >
        <p className="text-xs text-gray-500">
          현재가 <span className="font-bold text-gray-900">{formatNumber(stock.price)}원</span>
        </p>

        <div role="tablist" className="flex border-b">
          {ORDER_TYPES.map((item) => (
            <button
              key={item.type}
              type="button"
              role="tab"
              aria-selected={orderType === item.type}
              className={cn(
                'flex-1 py-2',
                orderType === item.type && 'border-b-2 border-current font-bold',
              )}
              onClick={() => changeOrderType(item.type)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">
            {isLimit ? '원하는 가격에' : '가장 빠른 가격에'} {sideLabel}할 수 있어요.
          </p>
          {side === 'BUY' ? (
            <p className="text-xs text-gray-500">
              사용 가능한 현금{' '}
              <span className="font-bold text-gray-900">
                {formatNumber(assets.availableCash)}원
              </span>
            </p>
          ) : (
            <SellableBreakdown holding={holding} minimumOwnHolding={MIN_OWN_HOLDING} />
          )}
        </div>

        {isLimit ? (
          <NumberField
            label="1주 희망 가격"
            unit="원"
            value={limitPrice}
            error={getError('price')}
            isActive={keypadTarget === 'price'}
            onActivate={() => selectField('price')}
            onChange={changeLimitPrice}
            addon={
              // 100원씩 내리고 올린다. 100원 단위가 아니면 그 방향의 가장 가까운 100원 단위로 (주문 5)
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="100원 내리기"
                  className="size-7 rounded-full border"
                  onClick={() =>
                    changeLimitPrice(Math.max(PRICE_TICK, ceilToTick(limitPrice) - PRICE_TICK))
                  }
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label="100원 올리기"
                  className="size-7 rounded-full border"
                  onClick={() => changeLimitPrice(floorToTick(limitPrice) + PRICE_TICK)}
                >
                  +
                </button>
              </div>
            }
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">1주 희망 가격</span>
            <p className="rounded-lg bg-gray-50 px-3 py-3 text-xl font-bold text-gray-500">
              최대한 빠른 가격
            </p>
          </div>
        )}

        <NumberField
          label="수량"
          unit="주"
          value={quantity}
          error={getError('quantity')}
          isActive={keypadTarget === 'quantity'}
          onActivate={() => selectField('quantity')}
          onChange={changeQuantity}
          hint={
            isLimit
              ? `총 ${formatNumber(limitPrice * quantity)}원`
              : // 시장가 예상 금액은 실시간 호가로 다시 계산된다 (주문 0, 3)
                `예상 ${formatNumber(estimateMarketAmount(stock, side, quantity))}원`
          }
        />
        {/* 키패드가 내려가 있으면 버튼만 화면 아래에 띄운다 */}
        {!keypadTarget && <FloatingFooter>{orderButton}</FloatingFooter>}
      </main>
      {/* 키패드가 올라와 있으면 키패드와 버튼을 아래에 붙인다 */}
      {keypadTarget && (
        <footer className="flex shrink-0 flex-col gap-2 px-9 pt-2 pb-6">
          <NumericKeypad onPress={handleKeypadPress} />
          {orderButton}
        </footer>
      )}
    </>
  );
}

// 구매하기·판매하기 (오버레이, 차트의 사기/팔기)
function OrderOverlay({ roomId, stockId, side }: OrderOverlayProps) {
  const stock = useQuery(stockQueries.detail(roomId, stockId));
  const assets = useQuery(assetQueries.mine(roomId));

  if (stock.data && assets.data) {
    return <OrderForm roomId={roomId} side={side} stock={stock.data} assets={assets.data} />;
  }

  const title = `${stock.data?.name ?? ''} ${SIDE_LABEL[side]}하기`;
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
        <div className="mx-9 mt-4 h-60 animate-pulse rounded-lg bg-gray-100" />
      )}
    </>
  );
}

export default OrderOverlay;
