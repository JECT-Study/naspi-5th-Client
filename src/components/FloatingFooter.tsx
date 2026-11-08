import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface FloatingFooterProps {
  children: ReactNode;
  /**
   * absolute(기본): 스크롤 영역(main) 밖에 두고 화면 아래에 띄운다. main에는 FLOATING_FOOTER_SPACE만큼 아래 여백을 준다
   * sticky: 스크롤 영역 안 맨 끝에 두면 스크롤하는 동안 아래에 붙어 있다 (종목 화면처럼 바깥 틀이 스크롤할 때)
   */
  position?: 'absolute' | 'sticky';
  className?: string;
}

/** absolute 하단 버튼(버튼 한 줄)에 가려지지 않게 스크롤 영역 아래에 줄 여백 */
export const FLOATING_FOOTER_SPACE = 'pb-24';
/** 버튼 아래에 글자 버튼이 한 줄 더 있을 때 (새 리그, 코드로 참여) */
export const FLOATING_FOOTER_SPACE_TALL = 'pb-32';

// 화면 아래에 떠 있는 버튼: 배경 없이 버튼만 떠 있고, 내용은 버튼 뒤로 지나간다
// 버튼 옆 빈 곳은 눌러도 뒤의 내용이 눌리도록 하고(pointer-events-none), 버튼만 누를 수 있다
function FloatingFooter({ children, position = 'absolute', className }: FloatingFooterProps) {
  return (
    <div
      className={cn(
        'pointer-events-none z-20 px-9 pb-6',
        position === 'absolute' ? 'absolute inset-x-0 bottom-0' : 'sticky bottom-0 mt-auto',
        className,
      )}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}

export default FloatingFooter;
