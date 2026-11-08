import type { RoomId } from '@/apis/domains/room/room.types';
import { mockAccountServer } from '@/mocks/account.mock';
import type { MyNotificationEvent } from './notification.types';

// 구독 해제 함수를 반환한다
// TODO: 서버가 준비되면 apis/socket.ts의 subscribe로 바꾼다
//   subscribe<MyNotificationEvent>(`/user/queue/leagues/${roomId}`, onEvent)
export const subscribeMyNotifications = (
  _roomId: RoomId,
  onEvent: (event: MyNotificationEvent) => void,
): (() => void) => mockAccountServer.subscribeNotifications(onEvent);
