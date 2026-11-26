import type {
  Bar,
  BarInterval,
  StockEvent,
  TickersEvent,
} from '@/apis/domains/market/market.types';
import type {
  MemberStockResponse,
  Orderbook,
  OrderBookResponse,
  StockDetail,
  StockResponse,
} from '@/apis/domains/stock/stock.types';
import { leagueMembersMock } from './members.mock';
import { createMockApiError } from './mockError';
import { meMock } from './user.mock';

// 시장 mock: 종목 상태를 메모리에 두고, 실시간 mock이 돌 때마다 가격을 조금씩 움직인다
// 종목 목록·개별 조회·호가·소개 수정은 msw 핸들러가 서버 응답 모양으로(mockStockServer), 봉은 아직 service가 직접 쓴다
// REST mock과 실시간 mock이 같은 상태를 보므로 다시 조회해도 값이 이어진다

interface MockStock {
  detail: StockDetail;
  bars: Record<BarInterval, Bar[]>;
}

const PRICE_TICK = 100;
const ORDERBOOK_LEVELS = 5;
const HISTORY_10M_COUNT = 6 * 24 * 5; // 10분봉 5일치
const BAR_SECONDS: Record<BarInterval, number> = { '10m': 600, '1h': 3600, '1d': 86400 };
const INTERVALS = Object.keys(BAR_SECONDS) as BarInterval[];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const nowSeconds = () => Math.floor(Date.now() / 1000);
const bucketOf = (time: number, interval: BarInterval) =>
  Math.floor(time / BAR_SECONDS[interval]) * BAR_SECONDS[interval];

const makeOrderbook = ({ price, upperLimit, lowerLimit }: StockDetail): Orderbook => ({
  asks: Array.from({ length: ORDERBOOK_LEVELS }, (_, i) => price + (i + 1) * PRICE_TICK)
    .filter((askPrice) => askPrice <= upperLimit)
    .map((askPrice) => ({ price: askPrice, quantity: randomInt(1, 30) })),
  bids: Array.from({ length: ORDERBOOK_LEVELS }, (_, i) => price - i * PRICE_TICK)
    .filter((bidPrice) => bidPrice >= lowerLimit)
    .map((bidPrice) => ({ price: bidPrice, quantity: randomInt(1, 30) })),
});

// 체결 1건을 간격별 봉에 반영한다. 같은 구간이면 갱신, 새 구간이면 봉을 추가
const applyTrade = (
  bars: Bar[],
  interval: BarInterval,
  time: number,
  price: number,
  volume: number,
) => {
  const bucket = bucketOf(time, interval);
  const last = bars[bars.length - 1];
  if (last && last.time === bucket) {
    bars[bars.length - 1] = {
      ...last,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
      volume: last.volume + volume,
    };
    return;
  }
  // 새 봉의 시가는 직전 봉의 종가. 고가·저가는 시가와 첫 체결가를 함께 본다 (고가 ≥ 시가·종가 ≥ 저가)
  const open = last?.close ?? price;
  bars.push({
    time: bucket,
    open,
    high: Math.max(open, price),
    low: Math.min(open, price),
    close: price,
    volume,
  });
};

const setPrice = (stock: MockStock, price: number) => {
  const { detail } = stock;
  detail.price = price;
  detail.change = price - detail.basePrice;
  detail.changeRate = Math.round((detail.change / detail.basePrice) * 1000) / 10;
  detail.orderbook = makeOrderbook(detail);
};

const trade = (stock: MockStock, time = nowSeconds()) => {
  const { detail } = stock;
  const price = clamp(
    detail.price + randomInt(-2, 2) * PRICE_TICK,
    detail.lowerLimit,
    detail.upperLimit,
  );
  const volume = randomInt(1, 30);
  INTERVALS.forEach((interval) => applyTrade(stock.bars[interval], interval, time, price, volume));
  setPrice(stock, price);
};

const createStock = (
  seed: Pick<StockDetail, 'stockId' | 'name' | 'description' | 'ownerName' | 'isMine'>,
  basePrice: number,
): MockStock => {
  const limit = Math.floor((basePrice * 0.3) / PRICE_TICK) * PRICE_TICK;
  const stock: MockStock = {
    detail: {
      ...seed,
      price: basePrice,
      change: 0,
      changeRate: 0,
      basePrice,
      upperLimit: basePrice + limit,
      lowerLimit: basePrice - limit,
      orderbook: { asks: [], bids: [] },
    },
    bars: { '10m': [], '1h': [], '1d': [] },
  };
  // 10분마다 한 번씩 체결된 것처럼 과거 봉을 만든다
  const start = bucketOf(nowSeconds(), '10m') - HISTORY_10M_COUNT * BAR_SECONDS['10m'];
  for (let i = 0; i <= HISTORY_10M_COUNT; i += 1) trade(stock, start + i * BAR_SECONDS['10m']);
  return stock;
};

// 리그 참여자 7명이 상장한 종목 (members.mock). 서버처럼 상장 순으로 둔다
export const marketMock: MockStock[] = [...leagueMembersMock]
  .sort((a, b) => Date.parse(a.listedAt) - Date.parse(b.listedAt))
  .map((member) =>
    createStock(
      {
        stockId: member.stockId,
        name: member.stockName,
        description: member.description,
        ownerName: member.name,
        isMine: member.userId === meMock.userId,
      },
      member.basePrice,
    ),
  );

const findMockStock = (stockId: number): MockStock => {
  const stock = marketMock.find(({ detail }) => detail.stockId === stockId);
  if (!stock) throw createMockApiError('304', '해당 리그에 종목이 없습니다.', 200);
  return stock;
};

const toMemberStock = ({ detail, bars }: MockStock): MemberStockResponse => ({
  stockId: detail.stockId,
  name: detail.name,
  description: detail.description,
  listerName: detail.ownerName,
  mine: detail.isMine,
  currentPrice: detail.price,
  basePrice: detail.basePrice,
  upperLimitPrice: detail.upperLimit,
  lowerLimitPrice: detail.lowerLimit,
  changeAmount: detail.change,
  changeRate: detail.changeRate,
  // 오늘 일봉의 거래량
  volume: bars['1d'].at(-1)?.volume ?? 0,
});

// msw 핸들러가 부르는 서버 응답 모양 (상장 순)
export const mockStockServer = {
  // GET /api/leagues/{leagueId}/stocks
  getStocks: (): MemberStockResponse[] => marketMock.map(toMemberStock),

  // GET /api/leagues/{leagueId}/stocks/{stockId} (리그에 없는 종목 304)
  getStock: (stockId: number): MemberStockResponse => toMemberStock(findMockStock(stockId)),

  // GET /api/leagues/{leagueId}/stocks/{stockId}/orderbook (최대 5단계)
  getOrderbook: (stockId: number): OrderBookResponse => {
    const { detail } = findMockStock(stockId);
    const toLevel = ({ price, quantity }: { price: number; quantity: number }) => ({
      orderPrice: price,
      remainingQuantity: quantity,
    });
    return {
      currentPrice: detail.price,
      asks: detail.orderbook.asks.slice(0, 5).map(toLevel),
      bids: detail.orderbook.bids.slice(0, 5).map(toLevel),
    };
  },

  // POST /api/leagues/{leagueId}/stocks/{stockId}/description (내 종목만, 서버 305)
  updateDescription: (stockId: number, description: string): StockResponse => {
    const stock = marketMock.find(({ detail }) => detail.stockId === stockId);
    if (!stock?.detail.isMine) throw createMockApiError('305', '본인의 종목이 아닙니다.', 200);
    stock.detail.description = description;
    return { stockId, name: stock.detail.name, description };
  },
};

// 리그 시세: 3초마다 아무 종목이나 체결시키고 전 종목 시세를 보낸다
export const subscribeMockTickers = (onEvent: (event: TickersEvent) => void) => {
  const timer = setInterval(() => {
    trade(marketMock[randomInt(0, marketMock.length - 1)]);
    onEvent({
      type: 'TICKERS',
      data: {
        stocks: marketMock.map(({ detail }) => ({
          stockId: detail.stockId,
          price: detail.price,
          change: detail.change,
          changeRate: detail.changeRate,
        })),
      },
    });
  }, 3000);
  return () => clearInterval(timer);
};

// 종목 상세: 2초마다 그 종목을 체결시키고 현재 상태를 보낸다
export const subscribeMockStock = (stockId: number, onEvent: (event: StockEvent) => void) => {
  const timer = setInterval(() => {
    const stock = marketMock.find(({ detail }) => detail.stockId === stockId);
    if (!stock) return;
    trade(stock);
    const { detail } = stock;
    onEvent({
      type: 'STOCK',
      data: {
        stockId,
        price: detail.price,
        change: detail.change,
        changeRate: detail.changeRate,
        bars: {
          '10m': stock.bars['10m'].slice(-2),
          '1h': stock.bars['1h'].slice(-2),
          '1d': stock.bars['1d'].slice(-2),
        },
        orderbook: detail.orderbook,
      },
    });
  }, 2000);
  return () => clearInterval(timer);
};
