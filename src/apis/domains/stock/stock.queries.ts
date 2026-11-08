import { queryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import { getStock, getStocks } from './stock.service';
import type { StockId } from './stock.types';

export const stockKeys = {
  room: (roomId: RoomId) => ['rooms', roomId, 'stocks'] as const,
  list: (roomId: RoomId) => [...stockKeys.room(roomId), 'list'] as const,
  // 봉(['rooms', roomId, 'stocks', stockId, 'bars', ...])과 따로 무효화할 수 있도록 'detail'을 붙인다
  detail: (roomId: RoomId, stockId: StockId) =>
    [...stockKeys.room(roomId), stockId, 'detail'] as const,
};

export const stockQueries = {
  list: (roomId: RoomId) =>
    queryOptions({
      queryKey: stockKeys.list(roomId),
      queryFn: () => getStocks(roomId),
    }),
  detail: (roomId: RoomId, stockId: StockId) =>
    queryOptions({
      queryKey: stockKeys.detail(roomId, stockId),
      queryFn: () => getStock(roomId, stockId),
    }),
};
