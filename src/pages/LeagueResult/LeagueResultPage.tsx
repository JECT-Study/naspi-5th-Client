import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leagueQueries } from '@/apis/domains/league/league.queries';
import type { Ranking } from '@/apis/domains/league/league.types';
import { sortRankings } from '@/apis/domains/league/league.utils';
import Button from '@/components/Button';
import ChangeRate from '@/components/ChangeRate';
import LeagueHeader from '@/components/LeagueHeader';
import LoadError from '@/components/LoadError';
import { useOpenLeagueEntry } from '@/hooks/useOpenLeagueEntry';
import { useRoomId } from '@/hooks/useRoomId';
import { cn } from '@/utils/cn';
import { formatKstDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';
import AssetHistoryChart from './components/AssetHistoryChart';
import ParticipantAssetsSheet from './components/ParticipantAssetsSheet';

// 리그 결과 (Depth 2, 배지 '종료'): 내 순위·수익률, 내 자산 추이, 최종 순위
// 참여자를 누르면 그 사람의 최종 자산을 바텀시트로 보여준다 (서비스 정책 2.5: 참여자별 자산 공개)
function LeagueResultPage() {
  const roomId = useRoomId();
  const result = useQuery(leagueQueries.result(roomId));
  const [selected, setSelected] = useState<Ranking | null>(null);
  const openLeagueEntry = useOpenLeagueEntry();

  const renderContent = () => {
    if (result.isPending) return <div className="h-60 animate-pulse rounded-lg bg-gray-100" />;
    if (result.isError) return <LoadError onRetry={() => result.refetch()} />;

    const { data } = result;
    return (
      <>
        <section>
          <p className="text-sm text-gray-500">{formatKstDate(new Date(data.endedAt))} 종료</p>
          <div className="mt-3 flex items-end justify-center gap-3">
            <span className="text-4xl font-bold">{data.myRank}위</span>
            <ChangeRate
              change={data.myProfit}
              changeRate={data.myProfitRate}
              className="mb-1 font-bold"
            />
          </div>
        </section>

        <section>
          <h2 className="font-bold">내 자산 추이</h2>
          <div className="mt-3">
            <AssetHistoryChart history={data.myAssetHistory} />
          </div>
        </section>

        <section>
          <h2 className="font-bold">최종 순위</h2>
          <ul className="mt-2">
            {sortRankings(data.rankings).map((ranking) => (
              <li key={ranking.userId}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-4 py-2 text-left',
                    ranking.isMe && 'rounded-lg bg-gray-50',
                  )}
                  onClick={() => setSelected(ranking)}
                >
                  <span className="w-8 shrink-0 text-center font-bold">{ranking.rank}위</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{ranking.name}</p>
                    <p className="truncate text-sm text-gray-500">{ranking.stockName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="font-bold">{formatNumber(ranking.totalAsset)}원</span>
                    <ChangeRate
                      change={ranking.profit}
                      changeRate={ranking.profitRate}
                      className="text-sm"
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  };

  return (
    <>
      <LeagueHeader leagueName={result.data?.name ?? ''} badge="종료" />
      <main className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-9 pt-4">
        {renderContent()}
        {/* 화면설계서 v1.4: 리그 결과의 '새 리그 만들기'는 플로팅이 아닌 일반 버튼 */}
        <div className="mt-auto pt-4 pb-6">
          <Button className="w-full" onClick={() => openLeagueEntry('leagueCreate')}>
            새 리그 만들기
          </Button>
        </div>
      </main>
      {selected && (
        <ParticipantAssetsSheet participant={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

export default LeagueResultPage;
