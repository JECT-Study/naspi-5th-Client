import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { getOverlayRoot } from './appFrame';
import { CloseIcon } from '@/components/ui/icons';

interface ModalProps {
  /** 제목. 줄바꿈은 \n으로 넣는다 */
  title: string;
  /** 제목 아래 설명. 문자열의 줄바꿈은 \n으로 넣는다 */
  description?: ReactNode;
  /** 제목 위 (로그인·완료 안내의 로고) */
  top?: ReactNode;
  /** 설명 아래 영역 (입력칸, 체크박스, 오류 문구 등). 간격 8로 쌓인다 */
  children?: ReactNode;
  /** 하단 버튼 영역 (구분선 아래 높이 48). 없으면 안내만 하는 모달 */
  footer?: ReactNode;
  /** 넘기면 X 버튼이 생기고, X나 바깥 영역을 누르면 닫힌다 */
  onClose?: () => void;
  /** 요청 중: X·바깥 클릭·Esc로 닫지 않는다 (요청 결과를 보여 줘야 하므로) */
  isCloseBlocked?: boolean;
  /** 본문 좌우 여백 (시안: 대부분 12, 탈퇴 8) */
  contentClassName?: string;
  /** notice: 버튼·X 없는 완료 안내 (모서리 12, 여백 24·20) */
  variant?: 'default' | 'notice';
}

// 가운데 뜨는 모달의 틀 (시안 Modal 160:15509). 열고 닫기는 부르는 쪽에서 조건부 렌더링으로 한다
// - 폭 300, 모서리 18, 흰색, ModalShadow
// - X가 있으면(Modal_Type1): 본문 여백 위 8·좌우 8·아래 24, 맨 위 오른쪽 X 18, 그 아래 내용(좌우 12)
// - X가 없으면(Modal_Type2, 이름 입력): 본문 여백 24·20
// - 내용: 제목 Title2 Grey/8 + 설명 Body2 Grey/5, 가운데 정렬, 간격 8
// - 버튼: 구분선(Grey/1 0.8) 아래 높이 48 (ModalActions)
// 닫기 규칙(화면설계서 공통): X 버튼이 있으면 X·바깥 클릭으로 닫히고, 없으면 내부 버튼으로만 닫힌다
// 부모에 transform이 생겨도 위치가 틀어지지 않도록 앱 틀에 바로 그린다. 어두운 배경은 앱 틀만 덮는다 (components/appFrame)
function Modal({
  title,
  description,
  top,
  children,
  footer,
  onClose,
  isCloseBlocked = false,
  contentClassName,
  variant = 'default',
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = isCloseBlocked ? undefined : onClose;

  // 열릴 때 모달 안으로 포커스를 옮기고, 닫히면 원래 있던 곳으로 되돌린다
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();
    return () => previousFocus?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    // 드로어처럼 뒤에 깔린 화면의 ESC 처리까지 가지 않게 막는다
    event.stopPropagation();
    close?.();
  };

  const isNotice = variant === 'notice';

  return createPortal(
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
      {/* 뒤 배경(딤)은 시안에 없어 임시 값 (프로토타입 연결 뒤 확인) */}
      <div className="absolute inset-0 bg-dim/40" aria-hidden="true" onClick={close} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex w-75 max-w-full flex-col bg-white shadow-modal outline-none',
          isNotice ? 'rounded-xl' : 'rounded-[18px]',
        )}
        onKeyDown={handleKeyDown}
      >
        <div
          className={cn(
            'flex flex-col items-center',
            onClose ? 'gap-2 px-2 pt-2 pb-6' : 'gap-4 px-5 py-6',
          )}
        >
          {onClose && (
            <div className="flex w-full justify-end">
              <button type="button" aria-label="닫기" disabled={isCloseBlocked} onClick={onClose}>
                <CloseIcon className="size-4.5 text-grey-8" />
              </button>
            </div>
          )}
          <div
            className={cn(
              'flex w-full flex-col items-center gap-2 text-center',
              onClose && 'px-3',
              contentClassName,
            )}
          >
            {top}
            <h2 id={titleId} className="text-title2 whitespace-pre-line text-grey-8">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="text-body2 whitespace-pre-line text-grey-5">
                {description}
              </div>
            )}
            {children}
          </div>
        </div>
        {footer && <div className="flex h-12 border-t-[0.8px] border-grey-1">{footer}</div>}
      </div>
    </div>,
    getOverlayRoot(),
  );
}

export default Modal;
