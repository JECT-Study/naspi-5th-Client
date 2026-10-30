import { Outlet } from 'react-router';

// 모든 페이지의 바깥 틀: 화면 높이에 고정(dvh), 구간별 최대 너비로 가운데 정렬
// 페이지 전체는 스크롤되지 않으므로, 넘치는 영역은 각 페이지에서 `min-h-0 flex-1 overflow-y-auto`로 스크롤시킨다
function AppLayout() {
  return (
    <div className="mx-auto flex h-dvh w-full flex-col overflow-hidden tablet:max-w-app-tablet desktop:max-w-app-desktop">
      <Outlet />
    </div>
  );
}

export default AppLayout;
