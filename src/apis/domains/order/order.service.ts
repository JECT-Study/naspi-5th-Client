import type { RoomId } from '@/apis/domains/room/room.types';
import { mockAccountServer } from '@/mocks/account.mock';
import { delay } from '@/mocks/delay';
import type { CreateOrderRequest, CreateOrderResponse, OpenOrder, OrderId } from './order.types';

// TODO: API가 준비되면 각 함수 안쪽을 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)

export const getOpenOrders = async (_roomId: RoomId): Promise<OpenOrder[]> => {
  await delay(300);
  return mockAccountServer.getOpenOrders();
};

export const createOrder = async (
  _roomId: RoomId,
  request: CreateOrderRequest,
): Promise<CreateOrderResponse> => {
  await delay(500);
  return mockAccountServer.createOrder(request);
};

export const cancelOrder = async (_roomId: RoomId, orderId: OrderId): Promise<void> => {
  await delay(300);
  mockAccountServer.cancelOrder(orderId);
};
