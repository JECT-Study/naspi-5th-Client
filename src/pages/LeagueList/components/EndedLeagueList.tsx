import type { EndedRoom } from '@/apis/domains/room/room.types';
import { formatKstDate } from '@/utils/date';
import LeagueCard from './LeagueCard';

interface EndedLeagueListProps {
  ended: EndedRoom[];
}

function EndedLeagueList({ ended }: EndedLeagueListProps) {
  if (ended.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-center text-sm text-gray-500">
          리그가 끝나도
          <br />
          결과를 다시 확인할 수 있어요.
        </p>
      </div>
    );
  }

  // 종료된 리그 시안은 다음 섹션에서 적용 (지금은 진행 중 카드 틀만 빌려 씀)
  return (
    <div className="flex flex-col gap-2 px-3 pt-4">
      {ended.map((room) => (
        <LeagueCard
          key={room.roomId}
          to={`/leagues/${room.roomId}/result`}
          name={room.name}
          badge={<span className="shrink-0 text-title4 text-grey-6">{room.rank}위</span>}
          meta={`${room.participantCount}명`}
          date={`${formatKstDate(new Date(room.endedAt))} 종료`}
        />
      ))}
    </div>
  );
}

export default EndedLeagueList;
