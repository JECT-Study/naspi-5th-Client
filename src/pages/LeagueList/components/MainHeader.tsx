import Dropdown from '@/components/Dropdown';
import GnbMenuButton from '@/components/GnbMenuButton';
import { PlusCircleIcon } from '@/components/icons';

export type LeagueEntryAction = 'create' | 'join';

interface MainHeaderProps {
  onEntrySelect: (action: LeagueEntryAction) => void;
}

// Depth 1 상단바 (화면설계서 공통 4-1): 가운데 로고, 오른쪽에 +(새 리그 만들기 / 코드로 참여)와 메뉴
function MainHeader({ onEntrySelect }: MainHeaderProps) {
  return (
    <header className="relative flex h-20 shrink-0 items-center justify-center px-7">
      <span className="font-bold">로고</span>
      <div className="absolute right-7 flex gap-5">
        <Dropdown
          label="새 리그 만들기 또는 코드로 참여"
          icon={<PlusCircleIcon />}
          items={[
            { label: '새 리그 만들기', onSelect: () => onEntrySelect('create') },
            { label: '코드로 참여', onSelect: () => onEntrySelect('join') },
          ]}
        />
        <GnbMenuButton />
      </div>
    </header>
  );
}

export default MainHeader;
