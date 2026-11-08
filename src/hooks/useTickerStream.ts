import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeTickers } from '@/apis/domains/market/market.socket';
import { applyTicker, applyTickers } from '@/apis/domains/market/market.utils';
import type { RoomId } from '@/apis/domains/room/room.types';
import { stockQueries } from '@/apis/domains/stock/stock.queries';

// 리그 시세(TICKERS)를 종목 목록과, 조회해 둔 종목 상세에 반영한다. 리그에 있는 동안 계속 구독한다
export const useTickerStream = (roomId: RoomId) => {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeTickers(roomId, (event) => {
        // 아직 조회하지 않은 캐시(prev 없음)는 건드리지 않는다
        queryClient.setQueryData(stockQueries.list(roomId).queryKey, (prev) =>
          prev ? applyTickers(prev, event.data.stocks) : prev,
        );
        event.data.stocks.forEach((ticker) => {
          queryClient.setQueryData(stockQueries.detail(roomId, ticker.stockId).queryKey, (prev) =>
            prev ? applyTicker(prev, ticker) : prev,
          );
        });
      }),
    [queryClient, roomId],
  );
};
