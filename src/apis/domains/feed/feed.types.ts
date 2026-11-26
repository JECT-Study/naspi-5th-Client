// API layer type
// 위: 서버 응답 그대로 (Swagger 리그 공시·뉴스 통합 피드). 아래: 화면이 쓰는 모양 (feed.mapper가 바꾼다)

import type { Reaction } from '@/apis/domains/disclosure/disclosure.types';
import type { Sentiment } from '@/apis/domains/news/news.types';
import type { StockId } from '@/apis/domains/stock/stock.types';

// ── 서버 응답 (GET /api/leagues/{leagueId}/feed) ──

/** 공시 반응 버튼: LIKE 호재, DISLIKE 악재 */
export type ReactionType = 'LIKE' | 'DISLIKE';
/** 뉴스 호재·악재: POSITIVE 호재, NEGATIVE 악재 */
export type NewsSentiment = 'POSITIVE' | 'NEGATIVE';

export interface CommentResponse {
  commentId: number;
  content: string;
  authorPlayerId: number;
  /** 탈퇴한 사용자면 비어 올 수 있어 대비한다 */
  authorName: string | null;
  mine: boolean;
  createdAt: string;
}

export interface DisclosureImageResponse {
  imageId: number;
  /** 발급 후 5분 동안만 열리는 주소. 지나면 목록·상세를 다시 조회해 새 주소를 받는다 */
  signedUrl: string;
  expiresAt: string;
}

export interface DisclosureListItemResponse {
  type: 'DISCLOSURE';
  disclosureId: number;
  stockId: StockId;
  stockName: string;
  title: string;
  body: string;
  /** 작성한 거래일 1~7 */
  tradingDay: number;
  createdAt: string;
  authorPlayerId: number;
  mine: boolean;
  images: DisclosureImageResponse[];
  likeCount: number;
  dislikeCount: number;
  myReaction: ReactionType | null;
  commentCount: number;
  /** 가장 먼저 등록된 댓글 1개. 없으면 null */
  previewComment: CommentResponse | null;
}

export interface NewsListItemResponse {
  type: 'NEWS';
  newsId: number;
  stockId: StockId;
  stockName: string;
  title: string;
  body: string;
  sentiment: NewsSentiment;
  tradingDay: number;
  /** 뉴스 생성 요청 일시 */
  createdAt: string;
  /** 발행 일시 (피드는 이 순서로 정렬) */
  publishedAt: string;
  commentCount: number;
  previewComment: CommentResponse | null;
}

export type FeedItemResponse = DisclosureListItemResponse | NewsListItemResponse;

/** 커서 페이지 (피드·종목별 공시 목록·종목별 뉴스 목록 모두 같은 모양) */
export interface PageResponse<T> {
  items: T[];
  /** 다음 페이지 커서. 마지막 페이지면 null */
  nextCursor: string | null;
}

export type FeedPageResponse = PageResponse<FeedItemResponse>;
/** 종목별 공시 목록 (GET .../stocks/{stockId}/disclosures). 항목 모양은 피드의 공시 항목과 같다 */
export type DisclosurePageResponse = PageResponse<DisclosureListItemResponse>;
/** 종목별 뉴스 목록 (GET .../stocks/{stockId}/news). 항목 모양은 피드의 뉴스 항목과 같다 */
export type NewsPageResponse = PageResponse<NewsListItemResponse>;

/** 피드 조회 조건. stockId·type이 없으면 리그 전체·공시와 뉴스 모두 (화면은 리그 전체만 쓴다) */
export interface FeedQuery {
  stockId?: StockId;
  type?: FeedContentType;
  cursor?: string;
  size: number;
}

// 반응 토글 (POST .../disclosures/{disclosureId}/reaction): 누른 버튼을 보내면 서버가 토글한다
export interface ReactToDisclosureRequest {
  type: ReactionType;
}

export interface DisclosureReactionResponse {
  disclosureId: number;
  likeCount: number;
  dislikeCount: number;
  myReaction: ReactionType | null;
}

// ── 화면 모양 ──

// 리그 피드 조회 (공시 + 뉴스, 최신순). 종목 정보의 공시·뉴스 목록도 같은 항목을 쓴다
export type FeedContentType = 'DISCLOSURE' | 'NEWS';

export interface CommentPreview {
  commentId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

interface FeedItemBase {
  stockId: StockId;
  stockName: string;
  title: string;
  content: string;
  commentCount: number;
  /** 등록 일시가 가장 이른 댓글 1건. 댓글이 없으면 null */
  firstComment: CommentPreview | null;
  /** 카드에 보이는 시간: 공시는 작성 일시, 뉴스는 발행 일시 (피드 정렬 기준과 같다) */
  createdAt: string;
}

export interface DisclosureFeedItem extends FeedItemBase {
  type: 'DISCLOSURE';
  disclosureId: number;
  /** 첨부 이미지 전체 (첨부 순서, 없으면 빈 배열). 설계서 v.1.8: 피드에서도 모두 보여 준다 */
  imageUrls: string[];
  /** 호재 반응 수 */
  bullishCount: number;
  /** 악재 반응 수 */
  bearishCount: number;
  /** 내가 누른 반응. 안 눌렀으면 null (카드에서 바로 반응을 바꾼다) */
  myReaction: Reaction | null;
}

export interface NewsFeedItem extends FeedItemBase {
  type: 'NEWS';
  newsId: number;
  /** AI가 공시를 바탕으로 쓴 뉴스인지 */
  isAiBriefing: boolean;
  sentiment: Sentiment;
}

export type FeedItem = DisclosureFeedItem | NewsFeedItem;

export interface FeedResponse {
  items: FeedItem[];
  /** 다음 페이지 커서. 마지막 페이지면 null */
  nextCursor: string | null;
}
