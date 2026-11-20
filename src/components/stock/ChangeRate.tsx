import { cn } from '@/utils/cn';
import { formatRate } from '@/utils/format';
import { TriangleDownIcon, TriangleUpIcon } from '@/components/ui/icons';
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
      {/* 시안 Up18/Down18: 18 칸 안에 삼각형이 10 정도로 그려져 있어 시안 크기 그대로 쓴다 */}
      {change > 0 && <TriangleUpIcon />}
      {change < 0 && <TriangleDownIcon />}
      {formatRate(changeRate)}
    </span>
  );
}

export default ChangeRate;
