import type { Sentiment } from '@/apis/domains/news/news.types';
import { cn } from '@/utils/cn';

type ChipKind = Sentiment | 'AI';

// 시안 Chip (160:9610): 여백 1·8, 모서리 10, Caption1 (높이 21)
// 호재 SubSell1 바탕 + NSSell(파랑) / 악재 SubBuy1 바탕 + NSBuy(빨강) / AI 공시브리핑 Grey/2 바탕 + Grey/6
const CHIPS: Record<ChipKind, { label: string; className: string }> = {
  BULLISH: { label: '호재', className: 'bg-sub-sell-1 text-ns-sell' },
  BEARISH: { label: '악재', className: 'bg-sub-buy-1 text-ns-buy' },
  AI: { label: 'AI 공시브리핑', className: 'bg-grey-2 text-grey-6' },
};

interface ChipProps {
  /** 뉴스 감정(호재·악재) 또는 AI 공시브리핑 */
  kind: ChipKind;
  className?: string;
}

// 뉴스의 호재·악재, AI 공시브리핑 표시 (피드·종목 정보 뉴스 카드, 뉴스 상세, 관련 뉴스)
function Chip({ kind, className }: ChipProps) {
  const chip = CHIPS[kind];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-[10px] px-2 py-px text-caption1',
        chip.className,
        className,
      )}
    >
      {chip.label}
    </span>
  );
}

export default Chip;
