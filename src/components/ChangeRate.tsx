import { cn } from '@/utils/cn';
import { formatRate } from '@/utils/format';
import { TriangleDownIcon, TriangleUpIcon } from './icons';
import { getPriceColorClass } from './priceColor';

interface ChangeRateProps {
  /** 기준가 대비 금액. 방향(색, 화살표)을 정한다 */
  change: number;
  changeRate: number;
  className?: string;
}

// ▲ 3.0% / ▼ 2.0% 형태의 등락률
function ChangeRate({ change, changeRate, className }: ChangeRateProps) {
  return (
    <span className={cn('flex items-center gap-0.5', getPriceColorClass(change), className)}>
      {change > 0 && <TriangleUpIcon className="size-2.5" />}
      {change < 0 && <TriangleDownIcon className="size-2.5" />}
      {formatRate(changeRate)}
    </span>
  );
}

export default ChangeRate;
