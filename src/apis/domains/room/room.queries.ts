import { queryOptions } from '@tanstack/react-query';
import { getInvitePreview, getMyRooms, getRoom, getWaitingRoom } from './room.service';
import type { RoomId } from './room.types';

export const roomKeys = {
  all: ['rooms'] as const,
  mine: () => [...roomKeys.all, 'mine'] as const,
  invite: (inviteCode: string) => [...roomKeys.all, 'invite', inviteCode] as const,
  room: (roomId: RoomId) => [...roomKeys.all, roomId] as const,
  detail: (roomId: RoomId) => [...roomKeys.room(roomId), 'detail'] as const,
  waiting: (roomId: RoomId) => [...roomKeys.room(roomId), 'waiting'] as const,
};

export const roomQueries = {
  mine: () =>
    queryOptions({
      queryKey: roomKeys.mine(),
      queryFn: getMyRooms,
    }),
  detail: (roomId: RoomId) =>
    queryOptions({
      queryKey: roomKeys.detail(roomId),
      queryFn: () => getRoom(roomId),
    }),
  waiting: (roomId: RoomId) =>
    queryOptions({
      queryKey: roomKeys.waiting(roomId),
      queryFn: () => getWaitingRoom(roomId),
    }),
  // 코드가 맞지 않으면 다시 시도해도 같으므로 재시도하지 않고, 같은 코드는 매번 새로 확인한다
  invite: (inviteCode: string) =>
    queryOptions({
      queryKey: roomKeys.invite(inviteCode),
      queryFn: () => getInvitePreview(inviteCode),
      retry: false,
      staleTime: 0,
    }),
};
