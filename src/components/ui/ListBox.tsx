import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ListBoxProps {
  children: ReactNode;
  className?: string;
}

// 종목 줄을 담는 테두리 상자 (시안 시장 '친구 종목 목록', 내 자산 '보유 종목 목록'·'List/대기중주문')
// 흰색 + Grey/3 테두리, 모서리 6, 여백 12·8, 줄 사이 8. 시안 테두리는 크기 안쪽이라 CSS 테두리와 여백 합이 같다
function ListBox({ children, className }: ListBoxProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border border-grey-3 bg-white px-2 py-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default ListBox;
