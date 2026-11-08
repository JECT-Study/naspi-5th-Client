import type { RoomId } from '@/apis/domains/room/room.types';
import { delay } from '@/mocks/delay';
import { mockLeagueServer } from '@/mocks/league.mock';
import type { LeagueResult } from './league.types';

// TODO: API가 준비되면 각 함수 안쪽을 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)

/** 리그 결과: 내 순위·자산 추이 + 참여자별 순위와 최종 자산(바텀시트)까지 한 번에 */
export const getLeagueResult = async (roomId: RoomId): Promise<LeagueResult> => {
  await delay(300);
  return mockLeagueServer.getResult(roomId);
};
