import { cn } from '@/utils/cn';

interface CharCounterProps {
  length: number;
  max: number;
  className?: string;
}

// 글자 수 "(n/최대)" Caption1 Grey/5 (시안 Character Count)
// - 입력을 시작하면 보여 주고, 비어 있으면 숨긴다
// - 최대에 닿거나 넘겨 치려 해도 색은 그대로 (시안 댓글 (50/50)도 Grey/5)
// 놓는 자리는 칸마다 부르는 쪽에서 정한다
function CharCounter({ length, max, className }: CharCounterProps) {
  if (length === 0) return null;
  return (
    <span className={cn('shrink-0 text-caption1 text-grey-5', className)}>
      ({length}/{max})
    </span>
  );
}

export default CharCounter;
