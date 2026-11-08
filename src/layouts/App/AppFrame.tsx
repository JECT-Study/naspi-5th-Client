import type { ReactNode } from 'react';

// 앱 틀: 화면 높이에 고정(dvh), 구간별 최대 너비로 가운데 정렬
// 페이지 전체는 스크롤되지 않으므로, 넘치는 영역은 각 페이지에서 `min-h-0 flex-1 overflow-y-auto`로 스크롤시킨다
// AppLayout과, 화면을 그리다 오류가 났을 때의 공통 오류 페이지가 같이 쓴다
function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex h-dvh w-full flex-col overflow-hidden tablet:max-w-app-tablet desktop:max-w-app-desktop">
      {children}
    </div>
  );
}

export default AppFrame;
