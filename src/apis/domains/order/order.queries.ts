import { queryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import { getOpenOrders } from './order.service';

export const orderKeys = {
  room: (roomId: RoomId) => ['rooms', roomId, 'orders'] as const,
  open: (roomId: RoomId) => [...orderKeys.room(roomId), 'open'] as const,
};

export const orderQueries = {
  open: (roomId: RoomId) =>
    queryOptions({
      queryKey: orderKeys.open(roomId),
      queryFn: () => getOpenOrders(roomId),
    }),
};
