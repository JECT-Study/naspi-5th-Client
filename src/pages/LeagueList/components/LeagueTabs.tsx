import TabIndicator from '@/components/TabIndicator';
import { getTabClassName, TAB_LIST_CLASS } from '@/components/tabStyles';

export type LeagueTab = 'ongoing' | 'ended';

const TABS: { value: LeagueTab; label: string }[] = [
  { value: 'ongoing', label: '진행 중인 리그' },
  { value: 'ended', label: '종료된 리그' },
];

interface LeagueTabsProps {
  tab: LeagueTab;
  onChange: (tab: LeagueTab) => void;
}

// 메인 리그 탭 (시안 LeagueTab: 화면 폭 2칸)
function LeagueTabs({ tab, onChange }: LeagueTabsProps) {
  return (
    <div role="tablist" className={TAB_LIST_CLASS}>
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
