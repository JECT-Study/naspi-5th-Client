import { cn } from '@/utils/cn';

interface CharCounterProps {
  length: number;
  max: number;
  /** 이 글자 수부터 보여준다 (화면설계서: 종목 소개 40, 공시 제목 20, 공시 내용 290, 댓글 90) */
  showFrom: number;
  /** 최대를 넘겨 입력하려 했는지 (hooks/useMaxLengthInput). 최대에 닿아 있으면 이미 붉다 */
  isOverLimit?: boolean;
  className?: string;
}

// 글자 수 "(n/최대)" (시안: Caption1, 입력칸 안 오른쪽 12·아래 6)
// 최대보다 적으면 NSBlue, 최대에 닿으면 NSBuy (화면설계서 "100자 입력 시 붉게 표시", 시안 50자 변형)
// 입력칸 테두리는 최대를 넘겨 입력하려 할 때 붉게 한다 (부르는 쪽, isOverLimit)
function CharCounter({ length, max, showFrom, isOverLimit = false, className }: CharCounterProps) {
  if (length < showFrom) return null;
  return (
    <span
      className={cn(
        'pointer-events-none absolute right-3 bottom-1.5 text-caption1',
        length >= max || isOverLimit ? 'text-ns-buy' : 'text-ns-blue',
        className,
      )}
    >
      ({length}/{max})
    </span>
  );
}

export default CharCounter;
