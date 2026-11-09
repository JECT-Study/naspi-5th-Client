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

  return (
    <div className="flex flex-col gap-2">
      {ended.map((room) => (
        <LeagueCard
          key={room.roomId}
          to={`/leagues/${room.roomId}/result`}
          name={room.name}
          badge={`${room.rank}위`}
          meta={`${room.participantCount}명`}
          date={`${formatKstDate(new Date(room.endedAt))} 종료`}
        />
      ))}
    </div>
  );
}

export default EndedLeagueList;
