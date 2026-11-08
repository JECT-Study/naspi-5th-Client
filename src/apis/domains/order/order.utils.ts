import type { StockDetail } from '@/apis/domains/stock/stock.types';
import type { OrderSide } from './order.types';

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
