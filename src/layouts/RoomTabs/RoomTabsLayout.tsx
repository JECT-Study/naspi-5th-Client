import { NavLink, Outlet } from 'react-router';
import { cn } from '@/utils/cn';

const TABS = [
  { to: '', label: '피드', end: true },
  { to: 'market', label: '시장', end: false },
  { to: 'assets', label: '내 자산', end: false },
  { to: 'ranking', label: '랭킹', end: false },
];

// 리그 메인 4개 화면(피드, 시장, 내 자산, 랭킹)의 공통 헤더 + 상단 탭
// 탭을 옮겨도 헤더는 다시 그려지지 않고, 아래 영역만 바뀐다
function RoomTabsLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between px-7 pt-7">
        <span className="font-bold">우리끼리 코스피</span>
      </header>
      <nav className="flex border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn('flex-1 py-3 text-center', isActive && 'border-b-2 border-current font-bold')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

export default RoomTabsLayout;
