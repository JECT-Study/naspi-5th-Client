// API layer type
// API 스펙 확정 전 실시간 문서(v2) 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

import type { Orderbook, StockId } from '@/apis/domains/stock/stock.types';

// 봉 조회
export type BarInterval = '10m' | '1h' | '1d';

export interface Bar {
  /** 구간 시작 시각 (Unix 초, UTC) */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 실시간: 리그 시세 (/topic/leagues/{leagueId})
export interface Ticker {
  stockId: StockId;
  price: number;
  change: number;
  changeRate: number;
}

export interface TickersEvent {
  type: 'TICKERS';
  data: { stocks: Ticker[] };
}

// 실시간: 종목 상세 (/topic/leagues/{leagueId}/stocks/{stockId})
export interface StockEvent {
  type: 'STOCK';
  data: {
    stockId: StockId;
    price: number;
    change: number;
    changeRate: number;
    /** 간격별 [직전 봉, 현재 봉] */
    bars: Record<BarInterval, Bar[]>;
    orderbook: Orderbook;
  };
}
