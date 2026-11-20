import { Link } from 'react-router';
import leagueImage2x from '@/assets/images/league@2x.png';
import leagueImage3x from '@/assets/images/league@3x.png';
import { cn } from '@/utils/cn';
import Dropdown, { type DropdownItem } from './Dropdown';
import GnbMenuButton from './GnbMenuButton';
import { HEADER_CLASS, HEADER_ICON_BUTTON_CLASS, HEADER_TITLE_CLASS } from './headerStyles';
import { MoreIcon } from './icons';

interface LeagueHeaderProps {
  leagueName: string;
  /** 점 3개 메뉴 (대기실 메뉴). 화면설계서에는 대기실에만 있다 */
  menu?: { label: string; items: DropdownItem[] };
}

// Depth 2 상단바 (화면설계서 공통 4-2, 시안 Header Depth2)
// 좌우 여백 8. 리그 대표 이미지(32, 모서리 8, 모든 리그 같은 이미지. 누르면 메인) + 간격 6 + 리그 이름
// 오른쪽에 점 3개 메뉴(있을 때)와 햄버거
// 대기실, 리그(피드/시장/내 자산/랭킹), 리그 결과에서 쓴다
function LeagueHeader({ leagueName, menu }: LeagueHeaderProps) {
  return (
    <header className={cn(HEADER_CLASS, 'px-2')}>
      <Link to="/leagues" aria-label="메인으로 이동" className="shrink-0 pl-3">
        <img
          src={leagueImage2x}
          srcSet={`${leagueImage2x} 2x, ${leagueImage3x} 3x`}
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-lg"
        />
      </Link>
      <h1 className={cn(HEADER_TITLE_CLASS, 'ml-1.5 min-w-0 flex-1')}>{leagueName}</h1>
      {menu && (
        <Dropdown
          label={menu.label}
          icon={<MoreIcon className="text-grey-6" />}
          buttonClassName={HEADER_ICON_BUTTON_CLASS}
          items={menu.items}
        />
      )}
      <GnbMenuButton />
    </header>
  );
}

export default LeagueHeader;
