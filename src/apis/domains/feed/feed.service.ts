import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { delay } from '@/mocks/delay';
import { feedMock } from '@/mocks/feed.mock';
import type { FeedContentType, FeedItem, FeedParams, FeedResponse } from './feed.types';

// mock은 커서를 목록 위치로 쓴다. 실제 커서 형식은 BE가 정한다
const paginate = (items: FeedItem[], { cursor, size }: FeedParams): FeedResponse => {
  const start = cursor ? Number(cursor) : 0;
  const end = start + size;
  return {
    items: items.slice(start, end),
    nextCursor: end < items.length ? String(end) : null,
  };
};

// 리그 피드 (공시 + 뉴스). TODO: API가 준비되면 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)
export const getFeed = async (_roomId: RoomId, params: FeedParams): Promise<FeedResponse> => {
  await delay(300);
  return paginate(feedMock, params);
};

// 종목 정보의 공시 또는 뉴스 목록. TODO: API가 준비되면 apiClient 호출로 바꾼다
export const getStockFeed = async (
  _roomId: RoomId,
  stockId: StockId,
  type: FeedContentType,
  params: FeedParams,
): Promise<FeedResponse> => {
  await delay(300);
  return paginate(
    feedMock.filter((item) => item.stockId === stockId && item.type === type),
    params,
  );
};
