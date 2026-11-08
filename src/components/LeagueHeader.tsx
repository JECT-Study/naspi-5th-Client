import type { ReactNode } from 'react';
import { Link } from 'react-router';
import GnbMenuButton from './GnbMenuButton';
import { LogoIcon } from './icons';

interface LeagueHeaderProps {
  leagueName: string;
  /** 대기실 "대기", 리그 "D-{N}", 리그 결과 "종료". 불러오는 중이면 없음 */
  badge?: string;
  /** 배지 옆 메뉴 (대기실의 점 3개 메뉴) */
  menu?: ReactNode;
}

// Depth 2 상단바 (화면설계서 공통 4-2): 로고(누르면 항상 메인) + 리그 이름 + 배지 + 메뉴
// 대기실, 리그(피드/시장/내 자산/랭킹), 리그 결과에서 쓴다
function LeagueHeader({ leagueName, badge, menu }: LeagueHeaderProps) {
  return (
    <header className="flex h-20 shrink-0 items-center gap-2 px-7">
      <Link to="/leagues" aria-label="메인으로 이동">
        <LogoIcon />
      </Link>
      <h1 className="truncate text-lg font-bold">{leagueName}</h1>
      {badge && <span className="shrink-0 rounded bg-gray-100 px-1.5 text-xs">{badge}</span>}
      {menu}
      <div className="ml-auto flex">
        <GnbMenuButton />
      </div>
    </header>
  );
}

export default LeagueHeader;
