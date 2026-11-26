import type { HoldingResponse, MyAssetResponse } from '@/apis/domains/asset/asset.types';
import type { MyNotificationEvent } from '@/apis/domains/notification/notification.types';
import type {
  CancelOrderResponse,
  OrderId,
  OrderListItem,
  OrderListResponse,
  OrderSide,
  OrderType,
  PlaceOrderResponse,
} from '@/apis/domains/order/order.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { marketMock } from './market.mock';
import { createMockApiError } from './mockError';

// 내 계좌 mock 서버 (msw/handlers가 서버 응답 모양으로 쓴다)
// 보유 주식·현금·대기 중인 주문을 메모리에 두고, 주문하면 잠시 뒤 체결 알림(내 알림)을 보낸다
// 가격은 시장 mock(marketMock)의 현재가를 그대로 쓴다

const INITIAL_ASSET = 100_000_000;
const INITIAL_PRICE = 10_000;
const MIN_OWN_HOLDING = 1_000;
const PRICE_TICK = 100;
const MARKET_PROTECTION_RATE = 0.05;
const MARKET_FILL_DELAY_MS = 1_000;
const LIMIT_FILL_DELAY_MS = 8_000;
// 취소하려 하면 그 사이 체결된 것으로 응답하는 주문 (주문 취소 실패 토스트 확인용)
const FILLED_ON_CANCEL_ORDER_ID = 2;
const PLAYER_ID = 1;

interface MockHolding {
  stockId: StockId;
  quantity: number;
  /** 평균 매입 단가 */
  averagePrice: number;
}

interface MockOpenOrder {
  orderId: OrderId;
  stockId: StockId;
  side: OrderSide;
  type: OrderType;
  /** 남은(미체결) 수량 */
  quantity: number;
  price: number;
  orderedAt: string;
}

// 서버처럼 비즈니스 실패도 HTTP 200 + code
const fail = (code: string, message: string): never => {
  throw createMockApiError(code, message, 200);
};

const findStock = (stockId: StockId) => {
  const stock = marketMock.find(({ detail }) => detail.stockId === stockId)?.detail;
  if (!stock) return fail('304', '리그에 없는 종목입니다.');
  return stock;
};

// 초기 배분 (서비스 정책 4.2): 상장자 2,500주, 나머지 2,500주는 다른 참여자에게 균등 배분하고
// 나누고 남은 주식은 상장자에게. 남은 금액은 현금
const OWNER_SHARES = 2_500;
const SHARED_SHARES = 2_500;
const otherCount = marketMock.length - 1;
const holdings: MockHolding[] = marketMock.map(({ detail }) => ({
  stockId: detail.stockId,
  quantity: detail.isMine
    ? OWNER_SHARES + (SHARED_SHARES % otherCount)
    : Math.floor(SHARED_SHARES / otherCount),
  averagePrice: INITIAL_PRICE,
}));
let cash =
  INITIAL_ASSET - holdings.reduce((sum, holding) => sum + holding.quantity * INITIAL_PRICE, 0);

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
let nextOrderId = 3;
let openOrders: MockOpenOrder[] = [
  {
    orderId: 1,
    stockId: 2,
    side: 'BUY',
    type: 'LIMIT',
    quantity: 3,
    price: 9_900,
    orderedAt: minutesAgo(30),
  },
  {
    orderId: FILLED_ON_CANCEL_ORDER_ID,
    stockId: 3,
    side: 'SELL',
    type: 'LIMIT',
    quantity: 10,
    price: findStock(3).upperLimit,
    orderedAt: minutesAgo(90),
  },
];

const listeners = new Set<(event: MyNotificationEvent) => void>();
const emit = (event: MyNotificationEvent) => listeners.forEach((listener) => listener(event));

const reservedCash = () =>
  openOrders
    .filter((order) => order.side === 'BUY')
    .reduce((sum, order) => sum + order.price * order.quantity, 0);
const sellingQuantity = (stockId: StockId) =>
  openOrders
    .filter((order) => order.side === 'SELL' && order.stockId === stockId)
    .reduce((sum, order) => sum + order.quantity, 0);
const findHolding = (stockId: StockId) => {
  let holding = holdings.find((item) => item.stockId === stockId);
  if (!holding) {
    holding = { stockId, quantity: 0, averagePrice: 0 };
    holdings.push(holding);
  }
  return holding;
};
// 서버의 매도 가능 수량: 보유 - 매도 주문 중 - (자사주면 최소 유지분)
const getOrderableQuantity = (stockId: StockId) => {
  const minimum = findStock(stockId).isMine ? MIN_OWN_HOLDING : 0;
  return Math.max(0, findHolding(stockId).quantity - sellingQuantity(stockId) - minimum);
};
const roundRate = (value: number) => Math.round(value * 10) / 10;

const fill = (orderId: OrderId, price: number) => {
  const order = openOrders.find((item) => item.orderId === orderId);
  if (!order) return;
  openOrders = openOrders.filter((item) => item.orderId !== orderId);
  const holding = findHolding(order.stockId);
  if (order.side === 'BUY') {
    const cost = holding.averagePrice * holding.quantity + price * order.quantity;
    holding.quantity += order.quantity;
    holding.averagePrice = Math.floor(cost / holding.quantity);
    cash -= price * order.quantity;
  } else {
    holding.quantity -= order.quantity;
    cash += price * order.quantity;
  }
  emit({
    type: 'ORDER_FILLED',
    data: { orderId, stockId: order.stockId, side: order.side },
  });
};

const toOrderListItem = (order: MockOpenOrder): OrderListItem => ({
  orderId: order.orderId,
  stockId: order.stockId,
  stockName: findStock(order.stockId).name,
  side: order.side,
  type: order.type,
  orderedAt: order.orderedAt,
  quantity: order.quantity,
  price: order.type === 'LIMIT' ? order.price : null,
  filledQuantity: null,
  pendingQuantity: order.quantity,
  canceledQuantity: null,
  executionPrice: null,
  averagedPrice: false,
});

export const mockAccountServer = {
  /** GET /api/leagues/{leagueId}/assets/me (보유 종목은 종목 ID 순) */
  getMyAssets: (): MyAssetResponse => {
    const rows: HoldingResponse[] = holdings
      .filter((holding) => holding.quantity > 0)
      .sort((a, b) => a.stockId - b.stockId)
      .map((holding) => {
        const stock = findStock(holding.stockId);
        const valuation = stock.price * holding.quantity;
        const cost = holding.averagePrice * holding.quantity;
        const profit = valuation - cost;
        return {
          stockId: holding.stockId,
          stockName: stock.name,
          treasuryStock: stock.isMine,
          quantity: holding.quantity,
          orderableQuantity: getOrderableQuantity(holding.stockId),
          currentPrice: stock.price,
          averagePrice: holding.averagePrice,
          valuation,
          profit,
          returnRate: cost > 0 ? roundRate((profit / cost) * 100) : 0,
        };
      });
    const stockValuation = rows.reduce((sum, row) => sum + row.valuation, 0);
    const totalAsset = cash + stockValuation;
    const totalProfit = totalAsset - INITIAL_ASSET;
    return {
      playerId: PLAYER_ID,
      deposit: cash,
      orderableDeposit: cash - reservedCash(),
      stockValuation,
      totalAsset,
      totalProfit,
      totalReturnRate: roundRate((totalProfit / INITIAL_ASSET) * 100),
      holdings: rows,
    };
  },

  /** GET /api/leagues/{leagueId}/orders?status=pending|completed (최신 먼저). 완료된 주문은 mock에 없다 */
  getOrders: (status: string | null, stockId?: StockId): OrderListResponse => {
    if (status !== 'pending' && status !== 'completed') {
      return fail('001', '요청 값이 올바르지 않습니다.');
    }
    if (status === 'completed') return { orders: [] };
    return {
      orders: [...openOrders]
        .filter((order) => stockId === undefined || order.stockId === stockId)
        .sort((a, b) => Date.parse(b.orderedAt) - Date.parse(a.orderedAt))
        .map(toOrderListItem),
    };
  },

  /** POST .../orders/limit, .../orders/market */
  placeOrder: (
    type: OrderType,
    {
      stockId,
      side,
      quantity,
      price,
    }: { stockId: StockId; side: OrderSide; quantity: number; price?: number },
  ): PlaceOrderResponse => {
    const stock = findStock(stockId);
    if (quantity < 1) fail('501', '주문 수량은 1주 이상이어야 합니다.');
    const isLimit = type === 'LIMIT';
    if (isLimit) {
      if (price === undefined || price < PRICE_TICK || price % PRICE_TICK !== 0) {
        fail('500', '주문 가격은 100원 이상의 100원 단위여야 합니다.');
      }
      if ((price ?? 0) > stock.upperLimit || (price ?? 0) < stock.lowerLimit) {
        fail('503', '주문 가격이 당일 상·하한가 범위를 벗어났습니다.');
      }
    }

    // 시장가는 최우선 상대 호가에서 5% 보호 범위까지 (서비스 정책 5.2)
    const bestAsk = stock.orderbook.asks[0]?.price ?? stock.price;
    const bestBid = stock.orderbook.bids[0]?.price ?? stock.price;
    const marketPrice =
      side === 'BUY'
        ? Math.min(
            stock.upperLimit,
            Math.floor((bestAsk * (1 + MARKET_PROTECTION_RATE)) / PRICE_TICK) * PRICE_TICK,
          )
        : Math.max(
            stock.lowerLimit,
            Math.floor((bestBid * (1 - MARKET_PROTECTION_RATE)) / PRICE_TICK) * PRICE_TICK,
          );
    const orderPrice = isLimit ? (price ?? stock.price) : marketPrice;

    if (side === 'BUY' && orderPrice * quantity > cash - reservedCash()) {
      fail('401', '주문 가능한 현금이 부족합니다.');
    }
    if (side === 'SELL' && quantity > getOrderableQuantity(stockId)) {
      const unreserved = findHolding(stockId).quantity - sellingQuantity(stockId);
      if (stock.isMine && quantity <= unreserved)
        fail('403', '자사주는 1,000주 이상 남겨야 합니다.');
      fail('402', '매도 가능한 수량이 부족합니다.');
    }

    const orderId = nextOrderId++;
    openOrders.push({
      orderId,
      stockId,
      side,
      type,
      quantity,
      price: orderPrice,
      orderedAt: new Date().toISOString(),
    });
    // 지정가는 잠시 뒤 지정한 가격으로, 시장가는 곧바로(현재가로) 체결된 것으로 친다 (체결 알림을 보낸다)
    if (isLimit) setTimeout(() => fill(orderId, orderPrice), LIMIT_FILL_DELAY_MS);
    else setTimeout(() => fill(orderId, findStock(stockId).price), MARKET_FILL_DELAY_MS);
    return { orderId, status: 'PENDING', quantity, remainingQuantity: quantity };
  },

  /** POST .../orders/{orderId}/cancel */
  cancelOrder: (orderId: OrderId): CancelOrderResponse => {
    const order = openOrders.find((item) => item.orderId === orderId);
    if (!order) return fail('504', '주문을 찾을 수 없습니다.');
    if (orderId === FILLED_ON_CANCEL_ORDER_ID) {
      fill(orderId, order.price);
      return fail('502', '처리할 수 없는 주문 상태입니다.');
    }
    openOrders = openOrders.filter((item) => item.orderId !== orderId);
    return {
      orderId,
      quantity: order.quantity,
      filledQuantity: 0,
      canceledQuantity: order.quantity,
    };
  },

  /**
   * 내 알림을 직접 보낸다 (리그 종료 등 화면 확인용). 브라우저 콘솔에서:
   *   (await import('/src/mocks/account.mock.ts')).mockAccountServer.emitNotification({ type: 'LEAGUE_ENDED', data: {} })
   */
  emitNotification: (event: MyNotificationEvent) => emit(event),

  subscribeNotifications: (listener: (event: MyNotificationEvent) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
