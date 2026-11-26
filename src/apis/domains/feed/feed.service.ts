import { apiClient, unwrap } from '@/apis/client';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import type { ApiResponse } from '@/apis/types';
import { toFeedResponse } from './feed.mapper';
import type {
  DisclosurePageResponse,
  FeedContentType,
  FeedPageResponse,
  FeedQuery,
  FeedResponse,
  NewsPageResponse,
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
