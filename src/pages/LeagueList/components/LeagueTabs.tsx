import TabIndicator from '@/components/ui/TabIndicator';
import { getTabClassName, TAB_LIST_CLASS } from '@/components/ui/tabStyles';
import { cn } from '@/utils/cn';

export type LeagueTab = 'ongoing' | 'ended';

const TABS: { value: LeagueTab; label: string }[] = [
  { value: 'ongoing', label: '진행 중인 리그' },
  { value: 'ended', label: '종료된 리그' },
];

interface LeagueTabsProps {
  tab: LeagueTab;
  onChange: (tab: LeagueTab) => void;
}

// 메인 리그 탭 (시안 LeagueTab: 화면 폭 2칸). 시안 Market Screen 위 여백 8만큼 상단바와 띄운다
function LeagueTabs({ tab, onChange }: LeagueTabsProps) {
  return (
    <div role="tablist" className={cn(TAB_LIST_CLASS, 'mt-2')}>
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={tab === value}
          className={getTabClassName(tab === value)}
          onClick={() => onChange(value)}
        >
          {label}
          {tab === value && <TabIndicator />}
        </button>
      ))}
    </div>
  );
}

export default LeagueTabs;
