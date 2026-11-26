import { withKstOffset } from '@/utils/date';
import type { OpenOrder, OrderListItem } from './order.types';

// 서버(주문) → 화면 모양. 일시는 KST에 시간대를 붙여 둔다 (utils/date withKstOffset)

/** 대기 주문: 남은 수량은 대기 수량. 대기 주문은 지정가뿐이라 가격이 있다 */
export const toOpenOrder = (order: OrderListItem): OpenOrder => ({
  orderId: order.orderId,
  stockId: order.stockId,
  stockName: order.stockName,
  side: order.side,
  quantity: order.pendingQuantity ?? 0,
  price: order.price ?? 0,
  orderedAt: withKstOffset(order.orderedAt),
});
