import { queryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import { getLeagueResult } from './league.service';

// 결과는 종료 후 바뀌지 않으므로 다시 조회하지 않는다
export const leagueKeys = {
  room: (roomId: RoomId) => ['rooms', roomId, 'result'] as const,
  result: (roomId: RoomId) => [...leagueKeys.room(roomId), 'summary'] as const,
};

export const leagueQueries = {
  result: (roomId: RoomId) =>
    queryOptions({
      queryKey: leagueKeys.result(roomId),
      queryFn: () => getLeagueResult(roomId),
      staleTime: Infinity,
    }),
};
