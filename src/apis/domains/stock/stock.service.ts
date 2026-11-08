import type { RoomId } from '@/apis/domains/room/room.types';
import { delay } from '@/mocks/delay';
import { marketMock, updateMockStockDescription } from '@/mocks/market.mock';
import { mockRoomServer } from '@/mocks/room.mock';
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

// 대기실에서 내 종목 상장. TODO: API가 준비되면 apiClient 호출로 바꾼다
export const listMyStock = async (roomId: RoomId, request: ListStockRequest): Promise<void> => {
  await delay(600);
  mockRoomServer.listMyStock(roomId, request);
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

// 대기실에서 내 종목 수정. TODO: API가 준비되면 apiClient 호출로 바꾼다
export const updateMyStock = async (roomId: RoomId, request: ListStockRequest): Promise<void> => {
  await delay(600);
  mockRoomServer.updateMyStock(roomId, request);
};
