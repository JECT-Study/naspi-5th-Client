import { apiClient, unwrap } from '@/apis/client';
import type { DisclosureId, Reaction } from '@/apis/domains/disclosure/disclosure.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import type { ApiResponse } from '@/apis/types';
import { toFeedResponse, toReaction, toReactionType } from './feed.mapper';
import type {
  DisclosurePageResponse,
  DisclosureReactionResponse,
  FeedContentType,
  FeedPageResponse,
  FeedQuery,
  FeedResponse,
  NewsPageResponse,
  ReactToDisclosureRequest,
} from './feed.types';

type PageQuery = Pick<FeedQuery, 'cursor' | 'size'>;

// 리그 피드 (공시 + 발행된 뉴스, 최신순)
export const getFeed = (roomId: RoomId, page: PageQuery): Promise<FeedResponse> =>
  apiClient
    .get<ApiResponse<FeedPageResponse>>(`/api/leagues/${roomId}/feed`, { params: page })
    .then(unwrap)
    .then(toFeedResponse);

// 종목 정보의 공시 목록·뉴스 목록은 종목별 API를 쓴다 (항목 모양이 피드와 같아 같은 매퍼로 바꾼다)
const STOCK_LIST_PATH: Record<FeedContentType, string> = {
  DISCLOSURE: 'disclosures',
  NEWS: 'news',
};

export const getStockFeed = (
  roomId: RoomId,
  stockId: StockId,
  type: FeedContentType,
  page: PageQuery,
): Promise<FeedResponse> =>
  apiClient
    .get<ApiResponse<DisclosurePageResponse | NewsPageResponse>>(
      `/api/leagues/${roomId}/stocks/${stockId}/${STOCK_LIST_PATH[type]}`,
      { params: page },
    )
    .then(unwrap)
    .then(toFeedResponse);

export interface DisclosureReactionResult {
  bullishCount: number;
  bearishCount: number;
  myReaction: Reaction | null;
}

/**
 * 공시 호재·악재 반응 토글: 누른 버튼을 보내면 서버가 등록·취소·변경을 정하고 토글 뒤 집계를 준다
 * (같은 버튼을 다시 누르면 취소, 반대 버튼이면 변경)
 */
export const toggleDisclosureReaction = (
  roomId: RoomId,
  stockId: StockId,
  disclosureId: DisclosureId,
  pressed: Reaction,
): Promise<DisclosureReactionResult> =>
  apiClient
    .post<ApiResponse<DisclosureReactionResponse>>(
      `/api/leagues/${roomId}/stocks/${stockId}/disclosures/${disclosureId}/reaction`,
      { type: toReactionType(pressed) } satisfies ReactToDisclosureRequest,
    )
    .then(unwrap)
    .then((result) => ({
      bullishCount: result.likeCount,
      bearishCount: result.dislikeCount,
      myReaction: toReaction(result.myReaction),
    }));
