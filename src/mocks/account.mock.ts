import type { Holding, MyAssets } from '@/apis/domains/asset/asset.types';
import type { MyNotificationEvent } from '@/apis/domains/notification/notification.types';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OpenOrder,
  OrderErrorCode,
  OrderId,
} from '@/apis/domains/order/order.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { marketMock } from './market.mock';
import { createMockApiError } from './mockError';
import { meMock } from './user.mock';

// 내 계좌 mock: 보유 주식·현금·대기 중인 주문을 메모리에 두고, 주문하면 잠시 뒤 체결 알림(내 알림)을 보낸다
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

interface MockHolding {
  stockId: StockId;
  quantity: number;
  /** 평균 매입 단가 */
  averagePrice: number;
}

const fail = (code: OrderErrorCode): never => {
  throw createMockApiError(code);
};

const findStock = (stockId: StockId) => {
  const stock = marketMock.find(({ detail }) => detail.stockId === stockId)?.detail;
  if (!stock) throw createMockApiError('NOT_FOUND', '종목을 찾을 수 없어요.', 404);
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
let openOrders: OpenOrder[] = [
  {
    orderId: 1,
    stockId: 2,
    stockName: findStock(2).name,
    side: 'BUY',
    quantity: 3,
    price: 9_900,
    orderedAt: minutesAgo(30),
  },
  {
    orderId: FILLED_ON_CANCEL_ORDER_ID,
    stockId: 3,
    stockName: findStock(3).name,
    side: 'SELL',
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
const getSellableQuantity = (stockId: StockId) => {
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
    holding.averagePrice = Math.round(cost / holding.quantity);
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

export const mockAccountServer = {
  getMyAssets: (): MyAssets => {
    const rows: Holding[] = holdings
      .filter((holding) => holding.quantity > 0)
      .map((holding) => {
        const stock = findStock(holding.stockId);
        const evaluationAmount = stock.price * holding.quantity;
        const cost = holding.averagePrice * holding.quantity;
        const profit = evaluationAmount - cost;
        return {
          stockId: holding.stockId,
          stockName: stock.name,
          isMine: stock.isMine,
          listedAt: stock.listedAt,
          quantity: holding.quantity,
          averagePrice: holding.averagePrice,
          sellingQuantity: sellingQuantity(holding.stockId),
          sellableQuantity: getSellableQuantity(holding.stockId),
          evaluationAmount,
          profit,
          profitRate: cost > 0 ? roundRate((profit / cost) * 100) : 0,
        };
      });
    const stockValue = rows.reduce((sum, row) => sum + row.evaluationAmount, 0);
    const totalAsset = cash + stockValue;
    const profit = totalAsset - INITIAL_ASSET;
    return {
      userName: meMock.name,
      totalAsset,
      profit,
      profitRate: roundRate((profit / INITIAL_ASSET) * 100),
      cash,
      availableCash: cash - reservedCash(),
      stockValue,
      holdings: rows,
    };
  },

  getOpenOrders: (): OpenOrder[] =>
    structuredClone(
      [...openOrders].sort((a, b) => Date.parse(b.orderedAt) - Date.parse(a.orderedAt)),
    ),

  createOrder: (request: CreateOrderRequest): CreateOrderResponse => {
    const stock = findStock(request.stockId);
    const isLimit = request.type === 'LIMIT';
    if (isLimit && request.price !== undefined) {
      if (request.price > stock.upperLimit || request.price < stock.lowerLimit) {
        fail('PRICE_OUT_OF_RANGE');
      }
    }

    // 시장가는 최우선 상대 호가에서 5% 보호 범위까지 (서비스 정책 5.2)
    const bestAsk = stock.orderbook.asks[0]?.price ?? stock.price;
    const bestBid = stock.orderbook.bids[0]?.price ?? stock.price;
    const marketPrice =
      request.side === 'BUY'
        ? Math.min(
            stock.upperLimit,
            Math.floor((bestAsk * (1 + MARKET_PROTECTION_RATE)) / PRICE_TICK) * PRICE_TICK,
          )
        : Math.max(
            stock.lowerLimit,
            Math.floor((bestBid * (1 - MARKET_PROTECTION_RATE)) / PRICE_TICK) * PRICE_TICK,
          );
    const price = isLimit ? (request.price ?? stock.price) : marketPrice;

    if (request.side === 'BUY' && price * request.quantity > cash - reservedCash()) {
      fail('INSUFFICIENT_CASH');
    }
    if (request.side === 'SELL' && request.quantity > getSellableQuantity(request.stockId)) {
      fail('INSUFFICIENT_SHARES');
    }

    const orderId = nextOrderId++;
    openOrders.push({
      orderId,
      stockId: stock.stockId,
      stockName: stock.name,
      side: request.side,
      quantity: request.quantity,
      price,
      orderedAt: new Date().toISOString(),
    });
    // 시장가는 바로(현재가로), 지정가는 잠시 뒤 지정한 가격으로 체결된 것으로 친다
    if (isLimit) setTimeout(() => fill(orderId, price), LIMIT_FILL_DELAY_MS);
    else setTimeout(() => fill(orderId, findStock(stock.stockId).price), MARKET_FILL_DELAY_MS);
    return { orderId };
  },

  cancelOrder: (orderId: OrderId) => {
    const order = openOrders.find((item) => item.orderId === orderId);
    if (!order) return fail('ORDER_ALREADY_FILLED');
    if (orderId === FILLED_ON_CANCEL_ORDER_ID) {
      fill(orderId, order.price);
      return fail('ORDER_ALREADY_FILLED');
    }
    openOrders = openOrders.filter((item) => item.orderId !== orderId);
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
