import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import LoadError from '@/components/LoadError';
import { useMyRooms } from '@/hooks/useMyRooms';
import { useOpenLeagueEntry } from '@/hooks/useOpenLeagueEntry';
import { useOpenOverlay } from '@/hooks/useOverlay';
import EndedLeagueList from './components/EndedLeagueList';
import LeagueTabs, { type LeagueTab } from './components/LeagueTabs';
import MainHeader, { type LeagueEntryAction } from './components/MainHeader';
import OngoingLeagueList from './components/OngoingLeagueList';

// 메인: 진행 중인 리그(+대기실) / 종료된 리그
// 탭은 URL(?tab=ended)에 둬서 리그 결과에서 뒤로 가기 하면 종료된 리그 탭으로 돌아온다
function LeagueListPage() {
  const openOverlay = useOpenOverlay();
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

  // 초대 링크(/leagues?code=ABCD123)로 들어오면 코드를 채운 코드로 참여를 띄우고, 주소의 코드는 지운다
  const inviteCode = searchParams.get('code');
  const handledInviteCodeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!inviteCode || handledInviteCodeRef.current === inviteCode) return;
    handledInviteCodeRef.current = inviteCode;
    openOverlay({ type: 'leagueJoin', inviteCode }, { replace: true, search: '' });
  }, [inviteCode, openOverlay]);

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-20 animate-pulse rounded-lg bg-gray-100" />
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
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-9 py-6">
        {renderContent()}
      </main>
    </>
  );
}

export default LeagueListPage;
