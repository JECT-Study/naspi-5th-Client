import type { Stock, StockDetail } from '@/apis/domains/stock/stock.types';
import type { Bar, BarInterval, StockEvent, Ticker } from './market.types';

export const BAR_INTERVALS: BarInterval[] = ['10m', '1h', '1d'];

/** 시세 1건을 종목(목록 항목·상세)에 반영한다 */
export const applyTicker = <T extends Stock>(stock: T, ticker: Ticker): T => ({
  ...stock,
  price: ticker.price,
  change: ticker.change,
  changeRate: ticker.changeRate,
});

/** 리그 시세(TICKERS)를 종목 목록에 반영한다 */
export const applyTickers = (stocks: Stock[], tickers: Ticker[]): Stock[] => {
  const tickerById = new Map(tickers.map((ticker) => [ticker.stockId, ticker]));
  return stocks.map((stock) => {
    const ticker = tickerById.get(stock.stockId);
    return ticker ? applyTicker(stock, ticker) : stock;
  });
};

/** 종목 상세(STOCK)의 현재가·대비·호가를 종목 상세에 반영한다 */
export const applyStockEvent = (stock: StockDetail, data: StockEvent['data']): StockDetail => ({
  ...stock,
  price: data.price,
  change: data.change,
  changeRate: data.changeRate,
  orderbook: data.orderbook,
});

/**
 * 실시간으로 받은 [직전 봉, 현재 봉]을 봉 목록에 반영한다.
 * 같은 시각의 봉은 바꾸고, 마지막 봉보다 뒤면 붙인다. 바뀌지 않은 봉은 그대로 둔다
 */
export const applyBarPair = (bars: Bar[], pair: Bar[]): Bar[] =>
  pair.reduce((result, bar) => {
    const last = result[result.length - 1];
    if (!last || bar.time > last.time) return [...result, bar];
    const index = result.findIndex((item) => item.time === bar.time);
    if (index < 0) return result;
    return result.map((item, i) => (i === index ? bar : item));
  }, bars);
