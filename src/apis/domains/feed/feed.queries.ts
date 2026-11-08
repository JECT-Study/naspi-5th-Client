import { infiniteQueryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { getFeed, getStockFeed } from './feed.service';
import type { FeedContentType, FeedResponse } from './feed.types';

// 화면설계서 공통: 처음 10건, 스크롤에 따라 10건씩 추가 조회
const FEED_PAGE_SIZE = 10;

const pageOptions = {
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage: FeedResponse) => lastPage.nextCursor ?? undefined,
};

export const feedKeys = {
  // 공시를 쓰거나 지우면 이 키로 리그 피드와 종목별 목록을 한 번에 무효화한다
  room: (roomId: RoomId) => ['rooms', roomId, 'feed'] as const,
  list: (roomId: RoomId) => [...feedKeys.room(roomId), 'all'] as const,
  stock: (roomId: RoomId, stockId: StockId, type: FeedContentType) =>
    [...feedKeys.room(roomId), 'stock', stockId, type] as const,
};

export const feedQueries = {
  list: (roomId: RoomId) =>
    infiniteQueryOptions({
      queryKey: feedKeys.list(roomId),
      queryFn: ({ pageParam }) => getFeed(roomId, { cursor: pageParam, size: FEED_PAGE_SIZE }),
      ...pageOptions,
    }),
  stock: (roomId: RoomId, stockId: StockId, type: FeedContentType) =>
    infiniteQueryOptions({
      queryKey: feedKeys.stock(roomId, stockId, type),
      queryFn: ({ pageParam }) =>
        getStockFeed(roomId, stockId, type, { cursor: pageParam, size: FEED_PAGE_SIZE }),
      ...pageOptions,
    }),
};
