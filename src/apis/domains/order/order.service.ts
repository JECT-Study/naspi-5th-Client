import { apiClient, unwrap } from '@/apis/client';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { ApiResponse } from '@/apis/types';
import { toOpenOrder } from './order.mapper';
import type {
  CancelOrderResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  OpenOrder,
  OrderId,
  OrderListResponse,
  PlaceLimitOrderRequest,
  PlaceMarketOrderRequest,
  PlaceOrderResponse,
} from './order.types';

// 주문 API. 진행 중인 리그에서만 쓸 수 있다
// 공통 실패 코드: 004 리그에 입장하지 않은 회원, 204 없는 리그, 211 시작 전, 212 종료됨 (그 밖의 코드는 함수마다 적는다)
const ordersPath = (roomId: RoomId) => `/api/leagues/${roomId}/orders`;

/** 대기 중인 주문 (일부 체결 후 남은 수량이 대기 중인 주문 포함, 최신 먼저) */
export const getOpenOrders = (roomId: RoomId): Promise<OpenOrder[]> =>
  apiClient
    .get<ApiResponse<OrderListResponse>>(ordersPath(roomId), { params: { status: 'pending' } })
    .then(unwrap)
    .then(({ orders }) => orders.map(toOpenOrder));

/**
 * 주문 (지정가·시장가 주소가 다르다). 지정가는 남은 수량이 대기 주문이 되고, 시장가는 남은 수량이 취소된다
 * 실패: 213 거래일 전환 중, 401 현금 부족, 402 매도 수량 부족, 403 자사주 최소 유지분, 500 가격 단위, 501 수량, 503 상·하한가
 */
export const createOrder = (
  roomId: RoomId,
  { stockId, side, type, quantity, price }: CreateOrderRequest,
): Promise<CreateOrderResponse> => {
  const request =
    type === 'LIMIT'
      ? apiClient.post<ApiResponse<PlaceOrderResponse>>(`${ordersPath(roomId)}/limit`, {
          stockId,
          side,
          price: price ?? 0,
          quantity,
        } satisfies PlaceLimitOrderRequest)
      : apiClient.post<ApiResponse<PlaceOrderResponse>>(`${ordersPath(roomId)}/market`, {
          stockId,
          side,
          quantity,
        } satisfies PlaceMarketOrderRequest);
  return request.then(unwrap);
};

/** 미체결 잔여 수량 취소 (이미 체결된 부분은 유지). 실패: 502 이미 체결·취소·만료, 504 주문 없음 */
export const cancelOrder = async (roomId: RoomId, orderId: OrderId): Promise<void> => {
  await apiClient.post<ApiResponse<CancelOrderResponse>>(`${ordersPath(roomId)}/${orderId}/cancel`);
};
