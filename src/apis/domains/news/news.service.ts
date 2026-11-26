import { apiClient, unwrap } from '@/apis/client';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import type { ApiResponse } from '@/apis/types';
import { toNewsDetail } from './news.mapper';
import type { NewsDetail, NewsDetailResponse, NewsId } from './news.types';

/** 뉴스 상세 (댓글 전체·원본 공시 포함). 실패: 610 뉴스가 없거나 발행 안 됨 */
export const getNews = (roomId: RoomId, stockId: StockId, newsId: NewsId): Promise<NewsDetail> =>
  apiClient
    .get<ApiResponse<NewsDetailResponse>>(`/api/leagues/${roomId}/stocks/${stockId}/news/${newsId}`)
    .then(unwrap)
    .then(toNewsDetail);
