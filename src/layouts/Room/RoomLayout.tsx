import { Outlet } from 'react-router';

// 리그 안의 모든 화면이 공유하는 틀 (UI 없음)
// 리그 데이터 로드, 종료된 리그는 결과 페이지로 이동, leagueId가 바뀌면 리그 단위 스토어 초기화를 여기서 처리한다
function RoomLayout() {
  return <Outlet />;
}

export default RoomLayout;
