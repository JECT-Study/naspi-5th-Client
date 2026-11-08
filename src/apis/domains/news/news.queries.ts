import { queryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import { getNews } from './news.service';
import type { NewsId } from './news.types';

export const newsKeys = {
  room: (roomId: RoomId) => ['rooms', roomId, 'news'] as const,
  detail: (roomId: RoomId, newsId: NewsId) => [...newsKeys.room(roomId), newsId] as const,
};

export const newsQueries = {
  detail: (roomId: RoomId, newsId: NewsId) =>
    queryOptions({
      queryKey: newsKeys.detail(roomId, newsId),
      queryFn: () => getNews(roomId, newsId),
    }),
};
