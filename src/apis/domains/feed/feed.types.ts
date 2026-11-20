// API layer type
// API 스펙 확정 전 화면설계서 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

import type { Reaction } from '@/apis/domains/disclosure/disclosure.types';
import type { Sentiment } from '@/apis/domains/news/news.types';
import type { StockId } from '@/apis/domains/stock/stock.types';

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
  createdAt: string;
}

export interface DisclosureFeedItem extends FeedItemBase {
  type: 'DISCLOSURE';
  disclosureId: number;
  /**
   * 첨부 이미지 전체 (첨부 순서, 없으면 빈 배열). 설계서 v.1.8: 피드에서도 모두 보여 준다
   * TODO(백엔드 요청): 지금 백엔드 공시 목록은 첫 장(thumbnail)과 장수(imageCount)만 준다. 목록에도 전체 이미지가 필요하다
   */
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

export interface FeedParams {
  /** 이전 응답의 nextCursor. 첫 페이지는 없음 */
  cursor?: string;
  size: number;
}

export interface FeedResponse {
  items: FeedItem[];
  /** 다음 페이지 커서. 마지막 페이지면 null */
  nextCursor: string | null;
}
