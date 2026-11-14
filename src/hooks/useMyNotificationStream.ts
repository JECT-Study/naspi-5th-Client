import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { assetKeys, assetQueries } from '@/apis/domains/asset/asset.queries';
import { subscribeMyNotifications } from '@/apis/domains/notification/notification.socket';
import { orderKeys, orderQueries } from '@/apis/domains/order/order.queries';
import { roomKeys } from '@/apis/domains/room/room.queries';
import type { RoomId } from '@/apis/domains/room/room.types';
import { stockKeys, stockQueries } from '@/apis/domains/stock/stock.queries';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { notify } from '@/libs/notify';
import { forcedNavigationState } from './useOverlay';

// 내 알림(실시간 문서 v2 3번)을 받아 다시 조회하고 토스트를 띄운다. 리그에 있는 동안 계속 구독한다
// 알림은 "다시 조회하라"는 신호라서 캐시를 직접 고치지 않고 무효화한다
export const useMyNotificationStream = (roomId: RoomId) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    // 체결 알림에는 종목 이름이 없어서 조회해 둔 종목·대기 중인 주문·내 자산에서 찾는다
    const findStockName = (stockId: StockId) =>
      queryClient
        .getQueryData(stockQueries.list(roomId).queryKey)
        ?.find((stock) => stock.stockId === stockId)?.name ??
      queryClient.getQueryData(stockQueries.detail(roomId, stockId).queryKey)?.name ??
      queryClient
        .getQueryData(orderQueries.open(roomId).queryKey)
        ?.find((order) => order.stockId === stockId)?.stockName ??
      queryClient
        .getQueryData(assetQueries.mine(roomId).queryKey)
        ?.holdings.find((holding) => holding.stockId === stockId)?.stockName;

    const refetchAccount = () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.room(roomId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.room(roomId) });
    };

    return subscribeMyNotifications(roomId, (event) => {
      switch (event.type) {
        case 'ORDER_FILLED':
        case 'ORDER_PARTIALLY_FILLED': {
          refetchAccount();
          const { stockId, side } = event.data;
          const stockName = findStockName(stockId);
          // 공통 5-6: {종목 이름} {매매 구분} 주문이 체결됐어요. + 확인하기 → 종목 - 내 주식
          notify.success(
            `${stockName ? `${stockName} ` : ''}${side === 'BUY' ? '매수' : '매도'} 주문이 체결됐어요.`,
            { link: { label: '확인하기', to: `/leagues/${roomId}/stocks/${stockId}/mine` } },
          );
          break;
        }
        case 'ORDER_CANCELED':
          refetchAccount();
          break;
        case 'DAY_CHANGED':
          // 공통 5-2. 새 기준가·상한가·하한가와 "어제보다" 문구를 다시 받는다
          queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
          queryClient.invalidateQueries({ queryKey: stockKeys.room(roomId) });
          notify.success('새 거래일이 시작돼 기준가가 바뀌었어요.');
          break;
        // 리그 시작·종료는 무엇을 하던 중이든 바로 옮긴다 (작성 중 확인도 건너뛰고, 열린 오버레이는 닫힌다)
        case 'LEAGUE_STARTED':
          queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
          queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
          navigate(`/leagues/${roomId}`, { replace: true, state: forcedNavigationState });
          break;
        case 'LEAGUE_ENDED':
          queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
          queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
          navigate(`/leagues/${roomId}/result`, { replace: true, state: forcedNavigationState });
          break;
      }
    });
  }, [queryClient, navigate, roomId]);
};
