import type { OngoingRoom, WaitingRoom } from '@/apis/domains/room/room.types';
import Button from '@/components/Button';
import { useOpenLeagueEntry } from '@/hooks/useOpenLeagueEntry';
import { formatDday, formatKstDate, getDaysUntil } from '@/utils/date';
import LeagueCard from './LeagueCard';

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

  if (ongoing.length === 0 && waiting.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="mb-2 font-bold">첫 리그를 시작해 보세요!</p>
        <Button className="w-full" onClick={() => openLeagueEntry('leagueCreate')}>
          새 리그 만들기
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => openLeagueEntry('leagueJoin')}
        >
          코드로 참여
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sortedOngoing.map((room) => {
        const endAt = new Date(room.endAt);
        return (
          <LeagueCard
            key={room.roomId}
            to={`/leagues/${room.roomId}`}
            name={room.name}
            badge={formatDday(getDaysUntil(endAt))}
            meta={`${room.participantCount}명`}
            date={`${formatKstDate(endAt)} 종료 예정`}
          />
        );
      })}

      {sortedWaiting.length > 0 && (
        <>
          <h2 className="mt-4 mb-1 font-bold">대기실</h2>
          {sortedWaiting.map((room) => (
            <LeagueCard
              key={room.roomId}
              to={`/leagues/${room.roomId}/waiting`}
              name={room.name}
              badge={room.isListed ? '상장 완료' : '상장 대기'}
              meta={`${room.listedCount}명 상장 완료`}
              date={`${formatKstDate(new Date(room.expiresAt))} 만료 예정`}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default OngoingLeagueList;
