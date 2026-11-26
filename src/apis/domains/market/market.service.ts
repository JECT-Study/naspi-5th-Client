import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { isMockServerEnabled } from '@/libs/mockServer';
import { delay } from '@/mocks/delay';
import { marketMock } from '@/mocks/market.mock';
import type { Bar, BarInterval } from './market.types';

// 과거 봉 목록. 마지막 원소가 진행 중인 봉
// 봉 조회 API가 아직 없다 (백엔드: 과거 봉은 REST, 최근 봉은 웹소켓 candles 토픽 예정)
// 가짜 서버(?msw)일 때만 mock 봉을 주고, 실제 서버에서는 빈 목록을 준다
// (실제 종목 ID는 mock에 없어서, 찾다가 실패하면 차트 화면 전체가 조회 실패로 바뀌었다)
// TODO: 봉 조회 API가 생기면 apiClient 호출로 바꾼다
export const getBars = async (
  _roomId: RoomId,
  stockId: StockId,
  interval: BarInterval,
): Promise<Bar[]> => {
  if (!isMockServerEnabled()) return [];
  await delay(300);
  const stock = marketMock.find(({ detail }) => detail.stockId === stockId);
  if (!stock) throw new Error('종목을 찾을 수 없어요.');
  return structuredClone(stock.bars[interval]);
};
