import { useCloseOverlay } from '@/hooks/useOverlay';
import { cn } from '@/utils/cn';
import { HEADER_CLASS, HEADER_TITLE_CLASS } from './headerStyles';
import { CloseBoldIcon } from './icons';

interface TaskHeaderAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** 요청 중. 누를 수 없고 회색으로 보인다 */
  isPending?: boolean;
}

interface TaskHeaderProps {
  title: string;
  /** 오른쪽 끝 글자 버튼 (공시 쓰기의 '게시', 종목 상장의 '상장') */
  action?: TaskHeaderAction;
}

// 오버레이 상단바 (화면설계서 공통 4-4, 시안 Header 오버레이 / 오버레이_비활성화): X(오버레이 닫기) + 가운데 제목, 메뉴 없음
// 오른쪽 여백 16. X는 44 영역 안에서 왼쪽 14. 오른쪽 글자 버튼은 Title1.5(M), 누를 수 있으면 NSBlue, 아니면 Grey/4
// 새 리그, 코드로 참여, 종목 상장, 주문, 공시 쓰기 오버레이에서 쓴다
// 시안에는 새 리그·코드로 참여·주문에도 '게시'가 보이지만 화면설계서에 없는 버튼이라 넣지 않았다
function TaskHeader({ title, action }: TaskHeaderProps) {
  const closeOverlay = useCloseOverlay();

  return (
    <header className={cn(HEADER_CLASS, 'pr-4')}>
      <button
        type="button"
        aria-label="닫기"
        className="flex h-11 shrink-0 items-center pr-1.5 pl-3.5"
        onClick={closeOverlay}
      >
        <CloseBoldIcon className="text-grey-7" />
      </button>
      {/* 제목은 상단바 가운데. 좌우 버튼(44, 오른쪽 글자 버튼 + 여백 16)과 겹치지 않게 양쪽 56을 비운다 */}
      <h1 className={cn(HEADER_TITLE_CLASS, 'pointer-events-none absolute inset-x-14 text-center')}>
        {title}
      </h1>
      {action && (
        <button
          type="button"
          className="ml-auto text-title1-5m text-ns-blue disabled:text-grey-4"
          disabled={action.disabled || action.isPending}
          aria-busy={action.isPending || undefined}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </header>
  );
}

export default TaskHeader;
