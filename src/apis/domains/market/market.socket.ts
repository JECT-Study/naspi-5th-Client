import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { isMockServerEnabled } from '@/libs/mockServer';
import { subscribeMockStock, subscribeMockTickers } from '@/mocks/market.mock';
import type { StockEvent, TickersEvent } from './market.types';

// 구독 해제 함수를 반환한다
// 지금은 가짜 서버(?msw)일 때만 mock 스트림을 돌리고, 실제 서버면 아무것도 구독하지 않는다
// TODO: 웹소켓이 준비되면 apis/socket.ts의 subscribe로 바꾼다
//   subscribe<TickersEvent>(`/topic/leagues/${roomId}`, onEvent)
const noop = () => {};

export const subscribeTickers = (
  _roomId: RoomId,
  onEvent: (event: TickersEvent) => void,
): (() => void) => (isMockServerEnabled() ? subscribeMockTickers(onEvent) : noop);

// TODO: 웹소켓이 준비되면 apis/socket.ts의 subscribe로 바꾼다
//   subscribe<StockEvent>(`/topic/leagues/${roomId}/stocks/${stockId}`, onEvent)
export const subscribeStock = (
  _roomId: RoomId,
  stockId: StockId,
  onEvent: (event: StockEvent) => void,
): (() => void) => (isMockServerEnabled() ? subscribeMockStock(stockId, onEvent) : noop);
