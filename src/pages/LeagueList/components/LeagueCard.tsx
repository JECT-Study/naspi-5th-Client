import { Link } from 'react-router';

interface LeagueCardProps {
  to: string;
  name: string;
  /** 오른쪽 위 뱃지 (D-day, 상장 상태, 순위) */
  badge: string;
  /** 아래 줄 왼쪽 */
  meta: string;
  /** 아래 줄 오른쪽 (날짜) */
  date?: string;
}

// 진행 중, 대기실, 종료된 리그 카드가 같은 틀을 쓴다
function LeagueCard({ to, name, badge, meta, date }: LeagueCardProps) {
  return (
    <Link to={to} className="flex flex-col gap-2 rounded-lg border px-6 py-5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-bold">{name}</span>
        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs">{badge}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{meta}</span>
        {date && <span>{date}</span>}
      </div>
    </Link>
  );
}

export default LeagueCard;
