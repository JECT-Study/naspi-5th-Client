// API layer type
// 위: 서버 응답 그대로 (Swagger 공시). 아래: 화면이 쓰는 모양 (disclosure.mapper가 바꾼다)

import type { Comment, CommentResponse } from '@/apis/domains/comment/comment.types';
import type { NewsId, NewsSentiment, Sentiment } from '@/apis/domains/news/news.types';
import type { StockId } from '@/apis/domains/stock/stock.types';

export type DisclosureId = number;
/** 공시 반응: 호재 BULLISH / 악재 BEARISH */
export type Reaction = Sentiment;

/** 공시 API 실패 코드 (Swagger) */
export const DISCLOSURE_ERROR_CODE = {
  /** 이미지가 JPEG·PNG가 아니거나 내용이 확장자와 다름 */
  INVALID_IMAGE_TYPE: '600',
  /** 빈 이미지이거나 50MB 초과 */
  INVALID_IMAGE_SIZE: '601',
  /** 이미지 5장 이상 */
  TOO_MANY_IMAGES: '602',
  /** 공시가 없거나 삭제됨 */
  NOT_FOUND: '607',
  /** 진행 중인 리그가 아님 (대기실, 종료). 반응 */
  LEAGUE_NOT_ACTIVE: '609',
  /** 공시에 뉴스가 없음 */
  NEWS_NOT_FOUND: '610',
  /** 생성에 실패한 뉴스가 아님 (생성 중·발행·미생성) */
  NEWS_NOT_FAILED: '612',
  /** 뉴스 다시 생성은 1분에 한 번 */
  NEWS_RETRY_TOO_SOON: '613',
} as const;

// ── 서버 응답 ──

/** 공시 반응 버튼: LIKE 호재, DISLIKE 악재 */
export type ReactionType = 'LIKE' | 'DISLIKE';

export interface DisclosureImageResponse {
  imageId: number;
  /** 발급 후 5분 동안만 열리는 주소. 지나면 목록·상세를 다시 조회해 새 주소를 받는다 */
  signedUrl: string;
  expiresAt: string;
}

/**
 * 공시로 만든 AI 뉴스 (상세의 news). PUBLISHED·FAILED일 때만 오고, 생성 중·생성 안 함이면 news 자체가 null
 * title·body·sentiment는 PUBLISHED일 때만 있다
 */
export interface DisclosureNewsResponse {
  newsId: NewsId;
  status: 'PENDING' | 'PUBLISHED' | 'SKIPPED' | 'FAILED';
  title: string | null;
  body: string | null;
  sentiment: NewsSentiment | null;
}

// 공시 상세 (GET .../stocks/{stockId}/disclosures/{disclosureId}). 종목 이름은 없다 (종목 목록에서 찾는다)
export interface DisclosureDetailResponse {
  disclosureId: DisclosureId;
  stockId: StockId;
  title: string;
  body: string;
  tradingDay: number;
  createdAt: string;
  authorPlayerId: number;
  mine: boolean;
  images: DisclosureImageResponse[];
  likeCount: number;
  dislikeCount: number;
  myReaction: ReactionType | null;
  commentCount: number;
  /** 댓글 전체 (오래된 순) */
  comments: CommentResponse[];
  news: DisclosureNewsResponse | null;
}

// 공시 작성 (POST .../stocks/{stockId}/disclosures, multipart) 응답
export interface PublishDisclosureResponse {
  disclosureId: DisclosureId;
  stockId: StockId;
  title: string;
  body: string;
  tradingDay: number;
  createdAt: string;
  imageIds: number[];
}

// 반응 토글 (POST .../disclosures/{disclosureId}/reaction): 누른 버튼을 보내면 서버가 토글한다
export interface ReactToDisclosureRequest {
  type: ReactionType;
}

export interface DisclosureReactionResponse {
  disclosureId: DisclosureId;
  likeCount: number;
  dislikeCount: number;
  myReaction: ReactionType | null;
}

// 뉴스 다시 생성 (POST .../disclosures/{disclosureId}/news/regenerate) 응답
export interface RegeneratedNewsResponse {
  newsId: NewsId;
  status: DisclosureNewsResponse['status'];
}

// ── 화면 모양 ──

/**
 * 공시 기반 AI 뉴스 상태 (서비스 정책 3.2)
 * PUBLISHED 발행됨, FAILED 자동 재시도까지 실패(작성자만 다시 시도 가능), NONE 그 밖(생성 중·생성 안 함)
 * 서버 상세가 생성 중과 생성 안 함을 구분해 주지 않아(둘 다 news null) 하나로 둔다
 */
export type NewsStatus = 'PUBLISHED' | 'FAILED' | 'NONE';

// 공시 상세
export interface DisclosureDetail {
  disclosureId: DisclosureId;
  stockId: StockId;
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
  /** 댓글 전체 (오래된 순). 댓글 목록의 처음 값으로 쓴다 */
  comments: Comment[];
  newsStatus: NewsStatus;
  /** 발행된 관련 뉴스 */
  relatedNews: { newsId: NewsId; title: string; sentiment: Sentiment } | null;
  createdAt: string;
}

// 공시 작성
export interface CreateDisclosureRequest {
  title: string;
  content: string;
  /** JPEG·PNG 최대 4장 (서비스 정책 3.1). 보낸 순서가 첨부 순서 */
  images: File[];
}

export interface CreateDisclosureResponse {
  disclosureId: DisclosureId;
}
