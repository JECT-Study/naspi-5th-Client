import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { marketQueries } from '@/apis/domains/market/market.queries';
import { subscribeStock } from '@/apis/domains/market/market.socket';
import { BAR_INTERVALS, applyBarPair, applyStockEvent } from '@/apis/domains/market/market.utils';
import type { RoomId } from '@/apis/domains/room/room.types';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import type { StockId } from '@/apis/domains/stock/stock.types';

// 종목 상세(STOCK)를 종목 상세와 간격별 봉에 반영한다. 차트 화면에 있는 동안만 구독한다
export const useStockStream = (roomId: RoomId, stockId: StockId) => {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeStock(roomId, stockId, (event) => {
        // 스냅샷(REST)이 오기 전(prev 없음)에 온 메시지는 무시한다
        queryClient.setQueryData(stockQueries.detail(roomId, stockId).queryKey, (prev) =>
          prev ? applyStockEvent(prev, event.data) : prev,
        );
        // 간격을 바꾸는 중이라 새 간격의 봉이 아직 없으면 그 간격은 건너뛴다
        BAR_INTERVALS.forEach((interval) => {
          queryClient.setQueryData(
            marketQueries.bars(roomId, stockId, interval).queryKey,
            (prev) => (prev ? applyBarPair(prev, event.data.bars[interval]) : prev),
          );
        });
      }),
    [queryClient, roomId, stockId],
  );
};
