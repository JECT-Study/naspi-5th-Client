// API layer type
// API 스펙 확정 전 화면설계서·서비스 정책 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

import type { StockId } from '@/apis/domains/stock/stock.types';

export type NewsId = number;
/** 호재 BULLISH / 악재 BEARISH */
export type Sentiment = 'BULLISH' | 'BEARISH';

// 뉴스 상세 조회
export interface NewsDetail {
  newsId: NewsId;
  stockId: StockId;
  stockName: string;
  /** AI가 공시를 바탕으로 쓴 뉴스인지 */
  isAiBriefing: boolean;
  sentiment: Sentiment;
  title: string;
  content: string;
  commentCount: number;
  /** 원문 공시. 원문이 삭제됐으면 null (isSourceDeleted로 구분) */
  sourceDisclosure: { disclosureId: number; title: string } | null;
  /** 원문 공시가 삭제됐는지 ("원문 공시가 삭제되었어요.") */
  isSourceDeleted: boolean;
  createdAt: string;
}
