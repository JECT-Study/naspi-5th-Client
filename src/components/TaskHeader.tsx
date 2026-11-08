import type { ReactNode } from 'react';
import { useCloseOverlay } from '@/hooks/useOverlay';
import { CloseIcon } from './icons';

interface TaskHeaderProps {
  title: string;
  /** 오른쪽 끝 버튼 (종목 상장의 '상장', 공시 쓰기의 '게시' 등) */
  action?: ReactNode;
}

// 작업형 화면 상단바 (화면설계서 공통 4-4): X(오버레이 닫기 = 뒤로 가기) + 제목, 메뉴 없음
// 새 리그, 코드로 참여, 종목 상장, 주문, 공시 쓰기 오버레이에서 쓴다
function TaskHeader({ title, action }: TaskHeaderProps) {
  const closeOverlay = useCloseOverlay();

  return (
    <header className="flex h-20 shrink-0 items-center gap-2 px-7">
      <button type="button" aria-label="닫기" onClick={closeOverlay}>
        <CloseIcon />
      </button>
      <h1 className="truncate text-lg font-bold">{title}</h1>
      {action && <div className="ml-auto flex">{action}</div>}
    </header>
  );
}

export default TaskHeader;
