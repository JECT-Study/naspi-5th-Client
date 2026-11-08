import { queryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { getBars } from './market.service';
import type { BarInterval } from './market.types';

export const marketKeys = {
  bars: (roomId: RoomId, stockId: StockId, interval: BarInterval) =>
    ['rooms', roomId, 'stocks', stockId, 'bars', interval] as const,
};

export const marketQueries = {
  bars: (roomId: RoomId, stockId: StockId, interval: BarInterval) =>
    queryOptions({
      queryKey: marketKeys.bars(roomId, stockId, interval),
      queryFn: () => getBars(roomId, stockId, interval),
    }),
};
