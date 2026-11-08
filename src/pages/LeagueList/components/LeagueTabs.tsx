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

function LeagueTabs({ tab, onChange }: LeagueTabsProps) {
  return (
    <div role="tablist" className="flex shrink-0 px-7">
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={tab === value}
          className={cn(
            'flex-1 border-b py-2 text-center',
            tab === value && 'border-b-2 border-current font-bold',
          )}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default LeagueTabs;
