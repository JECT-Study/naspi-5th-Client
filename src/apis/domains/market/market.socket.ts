import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { subscribeMockStock, subscribeMockTickers } from '@/mocks/market.mock';
import type { StockEvent, TickersEvent } from './market.types';

// 구독 해제 함수를 반환한다
// TODO: 서버가 준비되면 apis/socket.ts의 subscribe로 바꾼다
//   subscribe<TickersEvent>(`/topic/leagues/${roomId}`, onEvent)
export const subscribeTickers = (
  _roomId: RoomId,
  onEvent: (event: TickersEvent) => void,
): (() => void) => subscribeMockTickers(onEvent);

// TODO: 서버가 준비되면 apis/socket.ts의 subscribe로 바꾼다
//   subscribe<StockEvent>(`/topic/leagues/${roomId}/stocks/${stockId}`, onEvent)
export const subscribeStock = (
  _roomId: RoomId,
  stockId: StockId,
  onEvent: (event: StockEvent) => void,
): (() => void) => subscribeMockStock(stockId, onEvent);
