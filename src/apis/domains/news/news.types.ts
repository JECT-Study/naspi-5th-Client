// API layer type
// 위: 서버 응답 그대로 (Swagger 뉴스). 아래: 화면이 쓰는 모양 (news.mapper가 바꾼다)

import type { Comment, CommentResponse } from '@/apis/domains/comment/comment.types';
import type { StockId } from '@/apis/domains/stock/stock.types';

export type NewsId = number;
/** 호재 BULLISH / 악재 BEARISH */
export type Sentiment = 'BULLISH' | 'BEARISH';

/** 뉴스 API 실패 코드 (Swagger) */
export const NEWS_ERROR_CODE = {
  /** 뉴스가 없거나 발행되지 않음 */
  NOT_FOUND: '610',
} as const;

// ── 서버 응답 ──

/** 뉴스 호재·악재: POSITIVE 호재, NEGATIVE 악재 */
export type NewsSentiment = 'POSITIVE' | 'NEGATIVE';

/** 뉴스의 원본 공시 */
export interface NewsDisclosureResponse {
  disclosureId: number;
  title: string;
  body: string;
  createdAt: string;
}

// 뉴스 상세 (GET .../stocks/{stockId}/news/{newsId}). 종목 이름은 없다
export interface NewsDetailResponse {
  newsId: NewsId;
  stockId: StockId;
  title: string;
  body: string;
  sentiment: NewsSentiment;
  tradingDay: number;
  /** 뉴스 생성 요청 일시 */
  createdAt: string;
  /** 발행 일시 */
  publishedAt: string;
  commentCount: number;
  /** 댓글 전체 (오래된 순) */
  comments: CommentResponse[];
  /** 원본 공시. 원본 공시가 삭제됐으면(또는 공시 없이 만든 뉴스면) null */
  disclosure: NewsDisclosureResponse | null;
}

// ── 화면 모양 ──

// 뉴스 상세
export interface NewsDetail {
  newsId: NewsId;
  stockId: StockId;
  /** AI가 공시를 바탕으로 쓴 뉴스인지 */
  isAiBriefing: boolean;
  sentiment: Sentiment;
  title: string;
  content: string;
  commentCount: number;
  /** 댓글 전체 (오래된 순). 댓글 목록의 처음 값으로 쓴다 */
  comments: Comment[];
  /** 원문 공시. 원문이 삭제됐으면 null (isSourceDeleted로 구분) */
  sourceDisclosure: { disclosureId: number; title: string } | null;
  /** 원문 공시가 삭제됐는지 ("원문 공시가 삭제되었어요.") */
  isSourceDeleted: boolean;
  /** 카드에 보이는 시간 (발행 일시) */
  createdAt: string;
}
