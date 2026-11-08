import type {
  Bar,
  BarInterval,
  StockEvent,
  TickersEvent,
} from '@/apis/domains/market/market.types';
import type { Orderbook, StockDetail } from '@/apis/domains/stock/stock.types';
import { leagueMembersMock } from './members.mock';
import { meMock } from './user.mock';

// 시장 mock: 종목 상태를 메모리에 두고, 실시간 mock이 돌 때마다 가격을 조금씩 움직인다
// REST mock(종목, 봉)과 실시간 mock이 같은 상태를 보므로 다시 조회해도 값이 이어진다

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
  bars.push({
    time: bucket,
    open: last?.close ?? price,
    high: price,
    low: price,
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
  seed: Pick<StockDetail, 'stockId' | 'name' | 'description' | 'ownerName' | 'isMine' | 'listedAt'>,
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

// 리그 참여자 7명이 상장한 종목 (members.mock)
export const marketMock: MockStock[] = leagueMembersMock.map((member) =>
  createStock(
    {
      stockId: member.stockId,
      name: member.stockName,
      description: member.description,
      ownerName: member.name,
      isMine: member.userId === meMock.userId,
      listedAt: member.listedAt,
    },
    member.basePrice,
  ),
);

// 종목 정보에서 내 종목 소개 수정
export const updateMockStockDescription = (stockId: number, description: string) => {
  const stock = marketMock.find(({ detail }) => detail.stockId === stockId);
  if (stock) stock.detail.description = description;
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
