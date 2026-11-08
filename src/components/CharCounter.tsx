import { cn } from '@/utils/cn';

interface CharCounterProps {
  length: number;
  max: number;
  /** 이 글자 수부터 보여준다 (화면설계서: 종목 소개 40, 공시 제목 20, 공시 내용 290, 댓글 90) */
  showFrom: number;
  className?: string;
}

// 글자 수 세기 `n/최대`: 기준 이상 입력하면 보이고, 최대까지 쓰면 붉게 (화면설계서 공통 규칙)
function CharCounter({ length, max, showFrom, className }: CharCounterProps) {
  if (length < showFrom) return null;
  return (
    <span
      className={cn(
        'self-end text-xs',
        length >= max ? 'text-red-500' : 'text-gray-400',
        className,
      )}
    >
      {length}/{max}
    </span>
  );
}

export default CharCounter;
