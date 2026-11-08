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
  | { type: 'DAY_CHANGED'; data: { day: number } }
  | { type: 'LEAGUE_ENDED'; data: Record<string, never> };
