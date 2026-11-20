import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps {
  children: ReactNode;
  /** waiting: 대기실 "대기" (Grey/0 바탕) / 기본: 디데이 "D-3" (흰 바탕) */
  tone?: 'waiting' | 'default';
  className?: string;
}

// 시안 배지 (160:8628, 드로어 리그 목록 옆): 여백 5·8, 모서리 12, Grey/5 테두리 1(안쪽), Body3(t) Grey/5 (높이 18)
// - Body3(t)의 글자 위아래 여백 자르기(text-box-trim)는 flex 상자 안 글자에는 안 먹어서 inline-block으로 둔다
// - 시안 테두리는 높이 안쪽이라, 위아래 여백을 5 대신 4로 해 테두리를 포함해 18을 맞춘다 (글자 8 + 4·4 + 테두리 1·1)
function Badge({ children, tone = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-xl border border-grey-5 px-2 py-1 text-body3-t text-grey-5',
        tone === 'waiting' ? 'bg-grey-0' : 'bg-white',
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
