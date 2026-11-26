import { apiClient, unwrap } from '@/apis/client';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { ApiResponse } from '@/apis/types';
import { toMyAssets } from './asset.mapper';
import type { MyAssetResponse, MyAssets } from './asset.types';

/** 리그에서 내 자산 (현금·보유 주식·총자산). 평가 가격은 현재가. 실패: 400 리그 시작 전 */
export const getMyAssets = (roomId: RoomId): Promise<MyAssets> =>
  apiClient
    .get<ApiResponse<MyAssetResponse>>(`/api/leagues/${roomId}/assets/me`)
    .then(unwrap)
    .then(toMyAssets);
