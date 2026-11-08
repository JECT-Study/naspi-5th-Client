import { useContext, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { sessionStore } from '@/libs/session';
import { CloseIcon } from './icons';
import { KeepOnSessionExpiredContext } from './sessionModalContext';

interface ModalProps {
  title: string;
  /** 줄바꿈은 \n으로 넣는다 */
  description?: string;
  /** 설명 아래 영역 (입력창, 체크박스 등) */
  children?: ReactNode;
  /** 하단 버튼 영역. 없으면 안내만 하는 모달 */
  footer?: ReactNode;
  /** 넘기면 X 버튼이 생기고, X나 바깥 영역을 누르면 닫힌다 */
  onClose?: () => void;
}

// 가운데 뜨는 모달의 틀. 열고 닫기는 부르는 쪽에서 조건부 렌더링으로 한다
// 닫기 규칙(화면설계서 공통): X 버튼이 있으면 X·바깥 클릭으로 닫히고, 없으면 내부 버튼으로만 닫힌다
// 부모에 transform이 생겨도 위치가 틀어지지 않도록 body에 그린다
// 모달은 한 번에 하나: 재로그인 모달이 떠 있으면 나머지 모달은 숨긴다 (로그인 모달 쪽은 KeepOnSessionExpiredContext)
function Modal(props: ModalProps) {
  const isSessionExpired = useStore(sessionStore, (state) => state.isExpired);
  const keepOnSessionExpired = useContext(KeepOnSessionExpiredContext);
  if (isSessionExpired && !keepOnSessionExpired) return null;
  return <ModalPanel {...props} />;
}

function ModalPanel({ title, description, children, footer, onClose }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

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
    onClose?.();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-9">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative w-full max-w-80 rounded-xl bg-white p-5 outline-none"
        onKeyDown={handleKeyDown}
      >
        {onClose && (
          <button
            type="button"
            aria-label="닫기"
            className="absolute top-3 right-3"
            onClick={onClose}
          >
            <CloseIcon className="size-5" />
          </button>
        )}
        <h2 id={titleId} className="text-center font-bold">
          {title}
        </h2>
        {description && (
          <p
            id={descriptionId}
            className="mt-2 text-center text-sm whitespace-pre-line text-gray-500"
          >
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
