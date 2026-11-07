import { NavLink, Outlet } from 'react-router';
import { cn } from '@/utils/cn';

const TABS = [
  { to: '', label: '차트', end: true },
  { to: 'info', label: '종목 정보', end: false },
];

// 종목 상세 2개 화면(차트, 종목 정보)의 공통 헤더 + 상단 탭
// 탭을 옮겨도 헤더는 다시 그려지지 않고, 아래 영역만 바뀐다
function StockLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="px-7 pt-7">
        <span className="font-bold">종목 상세</span>
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

export default StockLayout;
