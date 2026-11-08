import { queryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import { getMyAssets } from './asset.service';

export const assetKeys = {
  room: (roomId: RoomId) => ['rooms', roomId, 'assets'] as const,
  mine: (roomId: RoomId) => [...assetKeys.room(roomId), 'mine'] as const,
};

export const assetQueries = {
  mine: (roomId: RoomId) =>
    queryOptions({
      queryKey: assetKeys.mine(roomId),
      queryFn: () => getMyAssets(roomId),
    }),
};
