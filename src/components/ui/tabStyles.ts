import { cn } from '@/utils/cn';

// 상단 탭 모양 (시안 LeagueTab·Tab·StockTab: 칸 개수만 다르고 모양은 같다)
// - 탭 줄: 높이 40, 흰 바탕, 칸은 같은 폭. 아래 구분선 없음
// - 글자: 칸 아래에서 8 위에 가운데. 선택 Title4 NSBlue / 미선택 Title4.5 Grey/6
// - 선택 표시: 칸 전체 폭 밑줄 2px NSBlue (TabIndicator)

/** 탭 줄 (role="tablist"나 nav에 붙인다) */
export const TAB_LIST_CLASS = 'flex h-10 shrink-0 bg-white';

/** 탭 한 칸 */
export const getTabClassName = (isActive: boolean) =>
  cn(
    'relative flex flex-1 items-end justify-center pb-2',
    isActive ? 'text-title4 text-ns-blue' : 'text-title4-5 text-grey-6',
  );
