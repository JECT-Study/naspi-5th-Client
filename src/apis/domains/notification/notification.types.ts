// API layer type
// 실시간 문서(v2) 3번 "내 알림" (/user/queue/leagues/{leagueId}) 기준. 확정되면 필드명과 구조를 맞춘다
// 프론트는 다시 조회하라는 신호로 쓴다

import type { OrderId, OrderSide } from '@/apis/domains/order/order.types';
import type { StockId } from '@/apis/domains/stock/stock.types';

interface OrderEventData {
  orderId: OrderId;
  stockId: StockId;
  side: OrderSide;
}

export type MyNotificationEvent =
  | { type: 'ORDER_FILLED'; data: OrderEventData }
  | { type: 'ORDER_PARTIALLY_FILLED'; data: OrderEventData }
  | { type: 'ORDER_CANCELED'; data: OrderEventData }
  | { type: 'LEAGUE_STARTED'; data: { day: number } }
  // hasExpiredOrders: 전 거래일에 대기 중이던 내 주문이 만료(취소)됐는지 (설계서 v1.9 공통 5-1·5-2 구분용)
  // 웹소켓 스펙이 나오기 전 임시 이름이다. 서버가 같은 알림 유형에 문구만 다르게 줄 수도 있어 스펙이 오면 맞춘다
  | { type: 'DAY_CHANGED'; data: { day: number; hasExpiredOrders: boolean } }
  | { type: 'LEAGUE_ENDED'; data: Record<string, never> };
