import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router';
import { roomQueries } from '@/apis/domains/room/room.queries';
import LeagueHeader from '@/components/header/LeagueHeader';
import TabIndicator from '@/components/ui/TabIndicator';
import { getTabClassName, TAB_LIST_CLASS } from '@/components/ui/tabStyles';
import { useRoomId } from '@/hooks/useRoomId';
import { cn } from '@/utils/cn';

const TABS = [
  { to: '', label: '피드', end: true },
  { to: 'market', label: '시장', end: false },
  { to: 'assets', label: '내 자산', end: false },
  { to: 'ranking', label: '랭킹', end: false },
];

// 리그 메인 4개 화면(피드, 시장, 내 자산, 랭킹)의 공통 헤더 + 상단 탭
// 탭을 옮겨도 헤더는 다시 그려지지 않고, 아래 영역만 바뀐다
// 탭 이동은 replace라서 브라우저 뒤로 가기를 누르면 리그에 들어오기 전 화면으로 간다
function RoomTabsLayout() {
  const roomId = useRoomId();
  const { data: room } = useQuery(roomQueries.detail(roomId));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LeagueHeader leagueName={room?.name ?? ''} />
      {/* 시안 Tab: 화면 폭 4칸, 상단바와 사이 8 (시안 '리그 피드 화면 콘텐츠' 위 여백) */}
      <nav className={cn(TAB_LIST_CLASS, 'mt-2')}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            replace
            className={({ isActive }) => getTabClassName(isActive)}
          >
            {({ isActive }) => (
              <>
                {tab.label}
                {isActive && <TabIndicator />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

export default RoomTabsLayout;
