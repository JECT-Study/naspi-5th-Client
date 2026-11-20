import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface FloatingFooterProps {
  children: ReactNode;
  className?: string;
}

// 화면 아래에 떠 있는 버튼: 배경 없이 버튼만 떠 있고, 스크롤하면 내용이 버튼 뒤로 지나간다
// 스크롤 영역 안 맨 끝에 둔다 (sticky bottom-0). 버튼이 자기 자리를 차지하므로
// 내용이 짧아 스크롤이 없을 때도 맨 아래 내용을 가리지 않는다 (mt-auto로 화면 맨 아래에 붙는다)
// 시안의 떠 있는 버튼(대기실 생성하기, 공시 쓰기, 주문 등)은 모두 화면 아래에서 27, 좌우 18(폭 324)
// 가로 여백은 놓이는 곳에 따라 다르다: 여백 없는 영역 안이면 className="px-4.5"
// 버튼 옆 빈 곳은 눌러도 뒤의 내용이 눌리도록 하고(pointer-events-none), 버튼만 누를 수 있다
function FloatingFooter({ children, className }: FloatingFooterProps) {
  return (
    <div
      className={cn(
        'pointer-events-none sticky bottom-0 z-20 mt-auto shrink-0 pt-4 pb-6.75',
        className,
      )}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}

export default FloatingFooter;
