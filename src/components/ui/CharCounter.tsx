import { cn } from '@/utils/cn';
import { isAtMaxLength } from '@/utils/maxLength';

interface CharCounterProps {
  length: number;
  max: number;
  className?: string;
}

// 글자 수 "(n/최대)" Caption1. 최대보다 적으면 Grey/5, 최대에 닿으면 NSBuy (디자이너 확인)
// 입력받는 칸은 모두 처음부터 보여 준다 (디자이너 확인). 놓는 자리는 칸마다 부르는 쪽에서 정한다
function CharCounter({ length, max, className }: CharCounterProps) {
  return (
    <span
      className={cn(
        'shrink-0 text-caption1',
        isAtMaxLength(length, max) ? 'text-ns-buy' : 'text-grey-5',
        className,
      )}
    >
      ({length}/{max})
    </span>
  );
}

export default CharCounter;
