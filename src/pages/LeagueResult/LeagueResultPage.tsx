import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leagueQueries } from '@/apis/domains/league/league.queries';
import type { Ranking } from '@/apis/domains/league/league.types';
import { sortRankings } from '@/apis/domains/league/league.utils';
import Button from '@/components/ui/Button';
import ChangeRate from '@/components/stock/ChangeRate';
import LeagueHeader from '@/components/header/LeagueHeader';
import LoadError from '@/components/status/LoadError';
import ListBox from '@/components/ui/ListBox';
import { useOpenLeagueEntry } from '@/hooks/useOpenLeagueEntry';
import { useRoomId } from '@/hooks/useRoomId';
import { formatKstDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';
import ErrorIllustration from '@/components/ui/ErrorIllustration';
import AssetHistoryChart from './components/AssetHistoryChart';
import ParticipantAssetsSheet from './components/ParticipantAssetsSheet';

// 리그 결과 (Depth 2 상단바): 내 순위·수익률, 내 자산 추이, 최종 순위
// 참여자를 누르면 그 사람의 최종 자산을 바텀시트로 보여준다 (서비스 정책 2.5: 참여자별 자산 공개)
function LeagueResultPage() {
  const roomId = useRoomId();
  const result = useQuery(leagueQueries.result(roomId));
  const [selected, setSelected] = useState<Ranking | null>(null);
  const openLeagueEntry = useOpenLeagueEntry();

  const renderContent = () => {
    if (result.isPending) {
      // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 결과 요약·차트·최종 순위 자리
      return (
        <div className="flex flex-col gap-4 px-6 pt-5">
          <div className="mx-auto h-20 w-48 animate-pulse rounded-md bg-grey-0" />
          <div className="h-60 animate-pulse rounded-md bg-grey-0" />
          <div className="h-60 animate-pulse rounded-md bg-grey-0" />
        </div>
      );
    }
    if (result.isError) return <LoadError onRetry={() => result.refetch()} />;

    const { data } = result;
    return (
      <>
        {/* 시안 'Ranking Summary': 여백 위 20·좌우 24·아래 12, 가운데 정렬, 사이 4
            종료일 Body1.5 Grey/6 → [작은 마스코트 50×53 + 10 + 순위 Heading1 Grey/8 + 10 + 수익률 Body2.5] */}
        <section className="flex flex-col items-center gap-1 px-6 pt-5 pb-3 text-center">
          <p className="text-body1-5 text-grey-6">{formatKstDate(new Date(data.endedAt))} 종료</p>
          <div className="flex items-center justify-center gap-2.5">
            <ErrorIllustration className="h-13.25 w-12.5" />
            <div className="flex items-end gap-2.5">
              <span className="text-heading1 text-grey-8">{data.myRank}위</span>
              <ChangeRate
                change={data.myProfit}
                changeRate={data.myProfitRate}
                className="gap-1 py-1 text-body2-5"
              />
            </div>
          </div>
        </section>

        {/* 시안: 제목 줄(여백 20·24·16, Title3 Grey/8) 아래 차트 영역이 화면 폭 전체(높이 240). 차트 모양은 시안에 없음 */}
        <section>
          <h2 className="px-6 pt-5 pb-4 text-title3 text-grey-8">내 자산 추이</h2>
          <AssetHistoryChart history={data.myAssetHistory} />
        </section>

        {/* 시안 최종 순위: 여백 20·24·16, 제목 → 16 → 테두리 상자 → 16 → '새 리그 만들기' (떠 있지 않음) */}
        <section className="flex flex-col gap-4 px-6 pt-5 pb-4">
          <h2 className="text-title3 text-grey-8">최종 순위</h2>
          <ListBox>
            {sortRankings(data.rankings).map((ranking) => (
              // 시안 순위카드: 높이 54, 왼쪽 8·오른쪽 4, 순위와 내용 사이 24, 모서리 4
              // - 순위 Title2.5 Grey/8 (오른쪽 정렬) / 이름 Title4 Grey/8, 3 띄우고 종목 이름 Body3 Grey/6
              // - 오른쪽: 총자산 Title2.5 Grey/8, 4 띄우고 수익률 Body2.5 (삼각형과 사이 4)
              <button
                key={ranking.userId}
                type="button"
                className="flex h-13.5 w-full items-center gap-6 rounded pr-1 pl-2 text-left"
                onClick={() => setSelected(ranking)}
              >
                <span className="min-w-5.75 shrink-0 text-right text-title2-5 text-grey-8">
                  {ranking.rank}위
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.75">
                    <p className="truncate text-title4 text-grey-8">{ranking.name}</p>
                    <p className="truncate text-body3 text-grey-6">{ranking.stockName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-title2-5 text-grey-8">
                      {formatNumber(ranking.totalAsset)}원
                    </span>
                    <ChangeRate
                      change={ranking.profit}
                      changeRate={ranking.profitRate}
                      className="gap-1 text-body2-5"
                    />
                  </div>
                </div>
              </button>
            ))}
          </ListBox>
          {/* 화면설계서 v1.4·디자이너 확정: 플로팅이 아닌 스크롤 영역 버튼, 그림자 없음. 흰색 + Grey/3 테두리, Grey/8 글자
              조회에 실패하면 보이지 않는다 (설계서·시안 조회 실패 화면) */}
          <Button
            variant="secondary"
            className="w-full border-grey-3 shadow-none"
            onClick={() => openLeagueEntry('leagueCreate')}
          >
            새 리그 만들기
          </Button>
        </section>
      </>
    );
  };

  return (
    <>
      <LeagueHeader leagueName={result.data?.name ?? ''} />
      {/* 시안 리그 결과: 위아래 8 안에 요약 → 내 자산 추이 → 최종 순위 */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">{renderContent()}</main>
      {selected && (
        <ParticipantAssetsSheet participant={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

export default LeagueResultPage;
