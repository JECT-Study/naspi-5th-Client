import Dropdown from '@/components/Dropdown';
import GnbMenuButton from '@/components/GnbMenuButton';
import { HEADER_CLASS, HEADER_ICON_BUTTON_CLASS } from '@/components/headerStyles';
import { PlusCircleIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

export type LeagueEntryAction = 'create' | 'join';

interface MainHeaderProps {
  onEntrySelect: (action: LeagueEntryAction) => void;
}

// Depth 1 상단바 (화면설계서 공통 4-1, 시안 Header Depth1)
// 좌우 여백 8. 왼쪽 로고 영역(95, 안쪽 왼쪽 12), 오른쪽 +(새 리그 만들기 / 코드로 참여)와 메뉴
// 로고는 눌러도 아무 일도 일어나지 않는다. 로고 원본이 나오기 전까지 글자로 둔다
function MainHeader({ onEntrySelect }: MainHeaderProps) {
  return (
    <header className={cn(HEADER_CLASS, 'justify-between px-2')}>
      <div className="flex h-11 w-[95px] items-center pl-3">
        <span className="font-bold text-grey-8">로고</span>
      </div>
      <div className="flex">
        <Dropdown
          label="새 리그 만들기 또는 코드로 참여"
          icon={<PlusCircleIcon className="text-grey-8" />}
          buttonClassName={HEADER_ICON_BUTTON_CLASS}
          items={[
            // 시안 ContextMenu/Main: 새 리그 만들기만 NSBlue로 강조
            { label: '새 리그 만들기', tone: 'primary', onSelect: () => onEntrySelect('create') },
            { label: '코드로 참여', onSelect: () => onEntrySelect('join') },
          ]}
        />
        <GnbMenuButton />
      </div>
    </header>
  );
}

export default MainHeader;
