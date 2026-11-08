import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { delay } from '@/mocks/delay';
import { marketMock } from '@/mocks/market.mock';
import type { Bar, BarInterval } from './market.types';

// 과거 봉 목록. 마지막 원소가 진행 중인 봉
// TODO: API가 준비되면 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)
export const getBars = async (
  _roomId: RoomId,
  stockId: StockId,
  interval: BarInterval,
): Promise<Bar[]> => {
  await delay(300);
  const stock = marketMock.find(({ detail }) => detail.stockId === stockId);
  if (!stock) throw new Error('종목을 찾을 수 없어요.');
  return structuredClone(stock.bars[interval]);
};
