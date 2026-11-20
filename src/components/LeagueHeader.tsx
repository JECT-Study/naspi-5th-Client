import type { ReactNode } from 'react';
import { Link } from 'react-router';
import GnbMenuButton from './GnbMenuButton';
import { LogoIcon } from './icons';

interface LeagueHeaderProps {
  leagueName: string;
  /** 리그 이름 옆 메뉴 (대기실의 점 3개 메뉴) */
  menu?: ReactNode;
}

// Depth 2 상단바 (화면설계서 공통 4-2): 로고(누르면 항상 메인) + 리그 이름 + 메뉴
// 대기실, 리그(피드/시장/내 자산/랭킹), 리그 결과에서 쓴다
// v.1.8에서 리그 이름 옆 종료 디데이(대기/D-N/종료) 표시가 빠졌다
function LeagueHeader({ leagueName, menu }: LeagueHeaderProps) {
  return (
    <header className="flex h-20 shrink-0 items-center gap-2 px-7">
      <Link to="/leagues" aria-label="메인으로 이동">
        <LogoIcon />
      </Link>
      <h1 className="truncate text-lg font-bold">{leagueName}</h1>
      {menu}
      <div className="ml-auto flex">
        <GnbMenuButton />
      </div>
    </header>
  );
}

export default LeagueHeader;
