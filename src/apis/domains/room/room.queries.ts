import { queryOptions } from '@tanstack/react-query';
import { toRoomDetail, toWaitingRoom } from './room.mapper';
import { getInvitePreview, getLeagueDetail, getMyRooms } from './room.service';
import type { RoomId } from './room.types';

export const roomKeys = {
  all: ['rooms'] as const,
  mine: () => [...roomKeys.all, 'mine'] as const,
  invite: (inviteCode: string) => [...roomKeys.all, 'invite', inviteCode] as const,
  room: (roomId: RoomId) => [...roomKeys.all, roomId] as const,
  /** 리그 상세 (대기실·리그 화면이 같은 응답을 나눠 쓴다) */
  detail: (roomId: RoomId) => [...roomKeys.room(roomId), 'detail'] as const,
};

// 리그 상세 한 번의 요청을 리그 화면(상단 이름·일차)과 대기실이 같이 쓴다. 화면 모양은 select로 바꾼다
const leagueDetailOptions = (roomId: RoomId) =>
  queryOptions({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => getLeagueDetail(roomId),
  });

export const roomQueries = {
  mine: () =>
    queryOptions({
      queryKey: roomKeys.mine(),
      queryFn: getMyRooms,
    }),
  detail: (roomId: RoomId) =>
    queryOptions({ ...leagueDetailOptions(roomId), select: toRoomDetail }),
  waiting: (roomId: RoomId) =>
    queryOptions({ ...leagueDetailOptions(roomId), select: toWaitingRoom }),
  // 코드가 맞지 않으면 다시 시도해도 같으므로 재시도하지 않고, 같은 코드는 매번 새로 확인한다
  invite: (inviteCode: string) =>
    queryOptions({
      queryKey: roomKeys.invite(inviteCode),
      queryFn: () => getInvitePreview(inviteCode),
      retry: false,
      staleTime: 0,
    }),
};
