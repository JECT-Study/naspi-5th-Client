import type { RoomId } from '@/apis/domains/room/room.types';
import { mockContentServer } from '@/mocks/content.mock';
import { delay } from '@/mocks/delay';
import type { NewsDetail, NewsId } from './news.types';

// TODO: API가 준비되면 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)
export const getNews = async (_roomId: RoomId, newsId: NewsId): Promise<NewsDetail> => {
  await delay(300);
  return mockContentServer.getNews(newsId);
};
