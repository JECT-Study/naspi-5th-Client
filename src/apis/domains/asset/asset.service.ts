import type { RoomId } from '@/apis/domains/room/room.types';
import { mockAccountServer } from '@/mocks/account.mock';
import { delay } from '@/mocks/delay';
import type { MyAssets } from './asset.types';

// TODO: API가 준비되면 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)
export const getMyAssets = async (_roomId: RoomId): Promise<MyAssets> => {
  await delay(300);
  return mockAccountServer.getMyAssets();
};
