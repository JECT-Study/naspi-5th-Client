// API layer type
// API 스펙 확정 전 화면설계서·서비스 정책 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

import type { NewsId, Sentiment } from '@/apis/domains/news/news.types';
import type { StockId } from '@/apis/domains/stock/stock.types';

export type DisclosureId = number;
/** 공시 반응: 호재 BULLISH / 악재 BEARISH */
export type Reaction = Sentiment;
/**
 * 공시 기반 AI 뉴스 상태 (서비스 정책 3.2)
 * GENERATING 생성 중, PUBLISHED 발행됨, FAILED 자동 재시도까지 실패(작성자만 다시 시도 가능), NONE 생성하지 않음
 */
export type NewsStatus = 'GENERATING' | 'PUBLISHED' | 'FAILED' | 'NONE';

/** 화면에서 문구를 나눠 보여주는 서버 에러 코드. TODO: BE와 코드 이름 맞추기 */
export type DisclosureErrorCode = 'CONTENT_DELETED';

// 공시 상세 조회
export interface DisclosureDetail {
  disclosureId: DisclosureId;
  stockId: StockId;
  stockName: string;
  /** 내가 쓴 공시인지 (삭제, 뉴스 다시 생성) */
  isMine: boolean;
  title: string;
  content: string;
  imageUrls: string[];
  bullishCount: number;
  bearishCount: number;
  /** 내 반응. 없으면 null */
  myReaction: Reaction | null;
  commentCount: number;
  newsStatus: NewsStatus;
  /** 발행된 관련 뉴스 */
  relatedNews: { newsId: NewsId; title: string; sentiment: Sentiment } | null;
  createdAt: string;
}

// 공시 작성
export interface CreateDisclosureRequest {
  title: string;
  content: string;
  /** JPEG·PNG 최대 4장 (서비스 정책 3.1). TODO: 업로드 방식(멀티파트/사전 업로드) BE와 확정 */
  images: File[];
}

export interface CreateDisclosureResponse {
  disclosureId: DisclosureId;
}

// 반응 (같은 반응을 다시 누르면 취소: null)
export interface ReactToDisclosureRequest {
  reaction: Reaction | null;
}
