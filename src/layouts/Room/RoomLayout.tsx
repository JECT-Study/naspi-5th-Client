import { Outlet } from 'react-router';
import { useMyNotificationStream } from '@/hooks/useMyNotificationStream';
import { useRoomId } from '@/hooks/useRoomId';
import { useTickerStream } from '@/hooks/useTickerStream';

// 리그 안의 모든 화면이 공유하는 틀 (UI 없음)
// 리그에 있는 동안 리그 시세와 내 알림을 구독한다 (실시간 문서 v2: 리그 입장 → 1번 + 3번 구독)
// TODO: 리그 상태 가드(종료된 리그는 결과로 이동), leagueId가 바뀌면 리그 단위 스토어 초기화
function RoomLayout() {
  const roomId = useRoomId();
  useTickerStream(roomId);
  useMyNotificationStream(roomId);

  return <Outlet />;
}

export default RoomLayout;
