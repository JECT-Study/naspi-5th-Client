import { apiClient } from '@/apis/client';
import type { RoomId } from '@/apis/domains/room/room.types';
import { delay } from '@/mocks/delay';
import { marketMock, updateMockStockDescription } from '@/mocks/market.mock';
import type {
  ListStockRequest,
  Stock,
  StockDetail,
  StockId,
  UpdateStockDescriptionRequest,
} from './stock.types';

// TODO: API가 준비되면 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)
// mock 상태는 계속 바뀌므로 복사해서 돌려준다
export const getStocks = async (_roomId: RoomId): Promise<Stock[]> => {
  await delay(300);
  return structuredClone(marketMock.map(({ detail }) => detail));
};

// TODO: API가 준비되면 apiClient 호출로 바꾼다
export const getStock = async (_roomId: RoomId, stockId: StockId): Promise<StockDetail> => {
  await delay(300);
  const stock = marketMock.find(({ detail }) => detail.stockId === stockId);
  if (!stock) throw new Error('종목을 찾을 수 없어요.');
  return structuredClone(stock.detail);
};

/**
 * 대기실에서 내 종목 상장 (리그당 1인 1종목). 실패 코드: 300 이름 규칙 위반, 301 소개 규칙 위반,
 * 302 같은 리그에 같은 이름, 303 이미 상장함
 */
export const listMyStock = async (roomId: RoomId, request: ListStockRequest): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/stocks`, request);
};

// 리그 진행 중 내 종목 소개 수정 (이름은 대기실에서만 바꿀 수 있다). TODO: API가 준비되면 apiClient 호출로 바꾼다
export const updateStockDescription = async (
  _roomId: RoomId,
  stockId: StockId,
  request: UpdateStockDescriptionRequest,
): Promise<void> => {
  await delay(300);
  updateMockStockDescription(stockId, request.description);
};

/**
 * 대기실에서 내 종목 이름·소개 수정 (시작된 뒤에는 소개만, updateStockDescription).
 * 실패 코드: 300·301 규칙 위반, 302 같은 리그에 같은 이름 (지금 이름 그대로는 가능), 305 내 종목이 아님
 */
export const updateMyStock = async (
  roomId: RoomId,
  stockId: StockId,
  request: ListStockRequest,
): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/stocks/${stockId}/edit`, request);
};
