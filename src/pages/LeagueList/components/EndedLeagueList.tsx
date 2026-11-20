import type { EndedRoom } from '@/apis/domains/room/room.types';
import { formatKstDate } from '@/utils/date';
import LeagueCard, { OutlineBadge } from './LeagueCard';
import LeagueEmptyState from './LeagueEmptyState';

interface EndedLeagueListProps {
  ended: EndedRoom[];
}

function EndedLeagueList({ ended }: EndedLeagueListProps) {
  // 리그 없음 (설계서 3-2): 문구는 시안대로 한 줄 (기획 확인)
  if (ended.length === 0) {
    return <LeagueEmptyState message="리그가 끝나도 결과를 다시 확인할 수 있어요!" />;
  }

  // 시안 '종료된 리그': 묶음 제목 없이 카드 목록만 (위아래 16, 좌우 12, 카드 사이 8)
  // 카드는 진행 중인 리그와 같은 모양, 배지에 최종 순위
  return (
    <div className="flex flex-col gap-2 px-3 py-4">
      {ended.map((room) => (
        <LeagueCard
          key={room.roomId}
          to={`/leagues/${room.roomId}/result`}
          name={room.name}
          badge={<OutlineBadge>{room.rank}위</OutlineBadge>}
          meta={`인원 ${room.participantCount}명`}
          date={`${formatKstDate(new Date(room.endedAt))} 종료`}
        />
      ))}
    </div>
  );
}

export default EndedLeagueList;
