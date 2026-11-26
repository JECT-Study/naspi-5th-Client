import type { StockDetail } from '@/apis/domains/stock/stock.types';
import type { CreateOrderResponse, OrderSide } from './order.types';

const SIDE_LABEL: Record<OrderSide, string> = { BUY: '매수', SELL: '매도' };

/** 주문 취소 토스트 문구 (설계서 v1.10 공통 5-7). 사용자 취소와 주문 직후 전량 취소가 같은 문구 */
export const ORDER_CANCELED_MESSAGE = '접수된 주문이 취소됐어요.';

/**
 * 새 주문 응답으로 띄울 토스트 문구들. 앞에서부터 순서대로 띄운다 (설계서 v1.10 공통 5, 기획 주문 토스트 케이스 A01~B05)
 * 서버는 접수·매칭·체결·취소를 요청 한 번에 끝내고 최종 상태를 주므로, 결과 안내도 응답으로 정한다
 * - 접수 (5-4)는 결과와 상관없이 늘 먼저
 * - 체결 (5-5): 전량 체결, 일부 체결 후 잔량 대기 (FILLED, PARTIALLY_FILLED)
 * - 일부 체결 (5-6): 일부 체결 후 잔량 취소 (CANCELED, 남은 수량 < 주문 수량)
 * - 취소 (5-7): 하나도 체결되지 않고 전량 취소 (CANCELED, 남은 수량 = 주문 수량. 자전거래 방지, 시장가 상대 주문 없음)
 * - 전량 대기 (PENDING)는 접수만
 * 취소 이유(자전거래·상대 주문 없음)는 기획이 같은 토스트로 묶어서 구분하지 않는다
 */
export const getOrderResultMessages = (
  stockName: string,
  side: OrderSide,
  { status, quantity, remainingQuantity }: CreateOrderResponse,
): string[] => {
  const messages = ['주문이 접수됐어요.'];
  const stockSide = `${stockName} ${SIDE_LABEL[side]}`;
  if (status === 'FILLED' || status === 'PARTIALLY_FILLED') {
    messages.push(`${stockSide} 주문이 체결됐어요.`);
  } else if (status === 'CANCELED') {
    messages.push(
      remainingQuantity < quantity
        ? `${stockSide} 주문이 일부 체결됐어요.`
        : ORDER_CANCELED_MESSAGE,
    );
  }
  return messages;
};

/** 주문 가격 단위 (서비스 정책 5.2: 100원 단위) */
export const PRICE_TICK = 100;

/** 내 종목(자사주) 최소 유지분 (서비스 정책 5.5) */
export const MIN_OWN_HOLDING = 1_000;

/** 시장가 보호 범위: 최우선 상대 호가 기준 5% (서비스 정책 5.2) */
const PROTECTION_PERCENT = 5;

/** 100원 단위로 내림 */
export const floorToTick = (price: number): number => Math.floor(price / PRICE_TICK) * PRICE_TICK;

/** 100원 단위로 올림 (화면설계서 주문 5: 지정가 희망 가격을 100원 단위가 아니게 쓰면 다음 100원 단위로) */
export const ceilToTick = (price: number): number => Math.ceil(price / PRICE_TICK) * PRICE_TICK;

type MarketStock = Pick<StockDetail, 'price' | 'upperLimit' | 'lowerLimit' | 'orderbook'>;

/**
 * 시장가 보호 가격 (서비스 정책 5.2)
 * - 구매: 최우선 매도 호가 × 1.05, 100원 미만 버림, 상한가를 넘으면 상한가 (보호최고가)
 * - 판매: 최우선 매수 호가 × 0.95, 100원 미만 버림, 하한가보다 낮으면 하한가 (보호최저가)
 * 상대 호가가 하나도 없으면 현재가를 기준으로 계산한다 (예상 금액용. 실제로는 체결 없이 전량 취소)
 */
export const getProtectionPrice = (stock: MarketStock, side: OrderSide): number => {
  const best = (side === 'BUY' ? stock.orderbook.asks[0] : stock.orderbook.bids[0])?.price;
  const base = best ?? stock.price;
  // 소수 오차가 없도록 정수로 계산한다
  if (side === 'BUY') {
    return Math.min(floorToTick((base * (100 + PROTECTION_PERCENT)) / 100), stock.upperLimit);
  }
  return Math.max(floorToTick((base * (100 - PROTECTION_PERCENT)) / 100), stock.lowerLimit);
};

/** 보호 범위 안의 상대 호가 (구매: 보호최고가 이하 매도 호가, 판매: 보호최저가 이상 매수 호가). 최우선부터 */
const getProtectedLevels = (stock: MarketStock, side: OrderSide, protection: number) =>
  side === 'BUY'
    ? stock.orderbook.asks.filter((level) => level.price <= protection)
    : stock.orderbook.bids.filter((level) => level.price >= protection);

/**
 * 시장가 예상 금액 (화면설계서 주문 3, 서비스 정책 5.3)
 * 보호 범위 안의 상대 호가를 최우선부터 주문 수량까지 차례로 채우고, 모자란 수량은 보호최고가/보호최저가로 계산한다
 * 화면에는 호가가 5단계까지만 오므로, 그 밖의 호가는 보호 가격으로 계산된다
 */
export const estimateMarketAmount = (
  stock: MarketStock,
  side: OrderSide,
  quantity: number,
): number => {
  const protection = getProtectionPrice(stock, side);
  let remaining = quantity;
  let amount = 0;
  for (const level of getProtectedLevels(stock, side, protection)) {
    if (remaining <= 0) break;
    const filled = Math.min(level.quantity, remaining);
    amount += level.price * filled;
    remaining -= filled;
  }
  return amount + remaining * protection;
};

/** 시장가로 살 수 있는 최대 수량: 예상 금액이 사용 가능한 현금을 넘지 않는 가장 큰 수량 */
export const getMaxMarketBuyQuantity = (stock: MarketStock, availableCash: number): number => {
  const protection = getProtectionPrice(stock, 'BUY');
  let cash = availableCash;
  let quantity = 0;
  for (const level of getProtectedLevels(stock, 'BUY', protection)) {
    const affordable = Math.min(level.quantity, Math.floor(cash / level.price));
    quantity += affordable;
    cash -= affordable * level.price;
    if (affordable < level.quantity) return quantity;
  }
  return quantity + Math.floor(cash / protection);
};

/** 지정가로 살 수 있는 최대 수량 */
export const getMaxLimitBuyQuantity = (price: number, availableCash: number): number =>
  price > 0 ? Math.floor(availableCash / price) : 0;
