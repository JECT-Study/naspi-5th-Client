import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/utils/cn';

interface LeagueCardProps {
  to: string;
  name: string;
  /** 오른쪽 위 배지 (DdayBadge, ListingBadge 등) */
  badge: ReactNode;
  /** 아래 줄 왼쪽 */
  meta: string;
  /** 아래 줄 오른쪽 (날짜) */
  date?: string;
  /** default: 진행 중인 리그 (흰 바탕 + Grey/1 테두리) / muted: 대기실 (Grey/0 바탕, 테두리 없음) */
  tone?: 'default' | 'muted';
}

// 메인 리그 카드 (시안 List/메인): 높이 88 = 여백 위 16 + 이름 줄 26 + 4 + 정보 줄 30 + 아래 12
// - 좌우 여백 18, 모서리 6
// - 시안 테두리는 안쪽 선이라 크기를 늘리지 않게 inset 그림자로 그린다
function LeagueCard({ to, name, badge, meta, date, tone = 'default' }: LeagueCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex flex-col gap-1 rounded-md px-4.5 pt-4 pb-3',
        tone === 'default' ? 'bg-white shadow-[inset_0_0_0_1px_var(--color-grey-1)]' : 'bg-grey-0',
      )}
    >
      <div className="flex h-6.5 items-center justify-between gap-1.5">
        <span className="truncate text-title2 text-grey-8">{name}</span>
        {badge}
      </div>
      <div className="flex h-7.5 items-center justify-between gap-2.5 text-body2 text-grey-5">
        <span>{meta}</span>
        {date && <span>{date}</span>}
      </div>
    </Link>
  );
}

/** 진행 중인 리그 종료 디데이 배지: 64×26, NSBlue 테두리, Title4(t) NSBlue */
export function DdayBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-6.5 w-16 shrink-0 items-center justify-center rounded-md border border-ns-blue bg-white">
      <span className="text-title4-t text-ns-blue">{children}</span>
    </span>
  );
}

/** 대기실 내 상장 상태 배지: "상장" Body2 Grey/6 + "완료" Title4 NSBlue / "대기" Title4 Grey/5 */
export function ListingBadge({ isListed }: { isListed: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-0.75 rounded-md border border-grey-2 bg-white px-2 py-0.5">
      <span className="text-body2 text-grey-6">상장</span>
      <span className={cn('text-title4', isListed ? 'text-ns-blue' : 'text-grey-5')}>
        {isListed ? '완료' : '대기'}
      </span>
    </span>
  );
}

export default LeagueCard;
