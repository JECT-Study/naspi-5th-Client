import { useSearchParams } from 'react-router';
import LoadError from '@/components/status/LoadError';
import { useMyRooms } from '@/hooks/useMyRooms';
import { useOpenLeagueEntry } from '@/hooks/useOpenLeagueEntry';
import EndedLeagueList from './components/EndedLeagueList';
import LeagueTabs, { type LeagueTab } from './components/LeagueTabs';
import MainHeader, { type LeagueEntryAction } from './components/MainHeader';
import OngoingLeagueList from './components/OngoingLeagueList';

// 메인: 진행 중인 리그(+대기실) / 종료된 리그
// 탭은 URL(?tab=ended)에 둬서 리그 결과에서 뒤로 가기 하면 종료된 리그 탭으로 돌아온다
function LeagueListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: LeagueTab = searchParams.get('tab') === 'ended' ? 'ended' : 'ongoing';
  const { data: rooms, isPending, isError, refetch } = useMyRooms();

  const handleTabChange = (next: LeagueTab) => {
    setSearchParams(next === 'ended' ? { tab: 'ended' } : {}, { replace: true });
  };

  // 새 리그 만들기, 코드로 참여 모두 동시 진행 리그 수 제한을 받는다
  const openLeagueEntry = useOpenLeagueEntry();
  const handleEntrySelect = (action: LeagueEntryAction) =>
    openLeagueEntry(action === 'create' ? 'leagueCreate' : 'leagueJoin');

  const renderContent = () => {
    if (isPending) {
      // 카드 자리만 흐리게 (시안 없음, 카드 크기·여백만 맞춤)
      return (
        <div className="flex flex-col gap-2 px-3 pt-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-22 animate-pulse rounded-md bg-grey-0" />
          ))}
        </div>
      );
    }
    if (isError) return <LoadError onRetry={() => refetch()} />;
    if (tab === 'ended') return <EndedLeagueList ended={rooms.ended} />;
    return <OngoingLeagueList ongoing={rooms.ongoing} waiting={rooms.waiting} />;
  };

  return (
    <>
      <MainHeader onEntrySelect={handleEntrySelect} />
      <LeagueTabs tab={tab} onChange={handleTabChange} />
      {/* 시안 Market Screen: 아래 여백 8. 좌우 여백은 묶음마다 다르게 안쪽에서 준다 */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2">{renderContent()}</main>
    </>
  );
}

export default LeagueListPage;
