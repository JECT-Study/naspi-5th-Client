import type { ReactNode } from 'react';
import type { OngoingRoom, WaitingRoom } from '@/apis/domains/room/room.types';
import Button from '@/components/ui/Button';
import { useOpenLeagueEntry } from '@/hooks/useOpenLeagueEntry';
import { formatDday, formatKstDate, getDaysUntil } from '@/utils/date';
import LeagueCard, { DdayBadge, ListingBadge } from './LeagueCard';

interface OngoingLeagueListProps {
  ongoing: OngoingRoom[];
  waiting: WaitingRoom[];
}

const byEarliest = <T,>(items: T[], getTime: (item: T) => string) =>
  [...items].sort((a, b) => Date.parse(getTime(a)) - Date.parse(getTime(b)));

// 진행 중인 리그 탭 (메인 2): 리그는 시작 일시, 대기실은 생성 일시가 이른 순으로 위에서부터
function OngoingLeagueList({ ongoing, waiting }: OngoingLeagueListProps) {
  const openLeagueEntry = useOpenLeagueEntry();
  const sortedOngoing = byEarliest(ongoing, (room) => room.startedAt);
  const sortedWaiting = byEarliest(waiting, (room) => room.createdAt);

  // 빈 화면은 다음 섹션에서 시안 적용 (지금은 좌우 여백만 맞춰 둠)
  if (ongoing.length === 0 && waiting.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-9">
        <p className="mb-2 font-bold">첫 리그를 시작해 보세요!</p>
        <Button className="w-full" onClick={() => openLeagueEntry('leagueCreate')}>
          새 리그 만들기
        </Button>
        <Button variant="subtle" className="w-full" onClick={() => openLeagueEntry('leagueJoin')}>
          코드로 참여
        </Button>
      </div>
    );
  }

  // 시안 Market Content: 묶음(나의 리그, 나의 대기실) 사이 28
  // 한쪽이 비면 그 묶음은 제목까지 숨긴다
  return (
    <div className="flex flex-col gap-7">
      {sortedOngoing.length > 0 && (
        <LeagueBoard title="나의 리그">
          {sortedOngoing.map((room) => {
            const endAt = new Date(room.endAt);
            return (
              <LeagueCard
                key={room.roomId}
                to={`/leagues/${room.roomId}`}
                name={room.name}
                badge={<DdayBadge>{formatDday(getDaysUntil(endAt))}</DdayBadge>}
                meta={`${room.participantCount}명`}
                date={`${formatKstDate(endAt)} 종료 예정`}
              />
            );
          })}
        </LeagueBoard>
      )}

      {sortedWaiting.length > 0 && (
        <LeagueBoard title="나의 대기실">
          {sortedWaiting.map((room) => (
            <LeagueCard
              key={room.roomId}
              to={`/leagues/${room.roomId}/waiting`}
              name={room.name}
              tone="muted"
              badge={<ListingBadge isListed={room.isListed} />}
              meta={`${room.listedCount}명 상장 완료`}
              date={`${formatKstDate(new Date(room.expiresAt))} 만료 예정`}
            />
          ))}
        </LeagueBoard>
      )}
    </div>
  );
}

// 시안 SmallBoard: 제목(SmallTitle, 여백 16·20, Title1 Grey/8, 높이 57) 아래 8 띄우고 카드 목록(좌우 12, 사이 8)
function LeagueBoard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-5 py-4 text-title1 text-grey-8">{title}</h2>
      <div className="flex flex-col gap-2 px-3">{children}</div>
    </section>
  );
}

export default OngoingLeagueList;
