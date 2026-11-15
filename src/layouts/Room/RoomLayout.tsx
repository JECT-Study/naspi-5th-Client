import { Outlet } from 'react-router';
import { useMyNotificationStream } from '@/hooks/useMyNotificationStream';
import { useRoomId } from '@/hooks/useRoomId';
import { useTickerStream } from '@/hooks/useTickerStream';

// 리그 안의 모든 화면이 공유하는 틀 (UI 없음)
// 리그에 있는 동안 리그 시세와 내 알림을 구독한다 (실시간 문서 v2: 리그 입장 → 1번 + 3번 구독)
// TODO: 리그 상태 가드(종료된 리그는 결과로 이동), leagueId가 바뀌면 리그 단위 스토어 초기화
// TODO: 리그 API 연동 때 참여자 가드: 참여자가 아니거나(004) 없는 리그(204)면 공통 오류 페이지(공통 7)
//       로그인 후 돌아가기(libs/loginReturnPath)나 공유받은 링크로 남의 리그 주소에 들어올 수 있다
function RoomLayout() {
  const roomId = useRoomId();
  useTickerStream(roomId);
  useMyNotificationStream(roomId);

  return <Outlet />;
}

export default RoomLayout;
