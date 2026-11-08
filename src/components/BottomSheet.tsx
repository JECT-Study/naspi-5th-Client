import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { CloseIcon } from './icons';

interface BottomSheetProps {
  title: string;
  children: ReactNode;
  /** 슬라이드 아웃이 끝난 뒤 불린다. 부르는 쪽은 여기서 시트를 내린다(조건부 렌더링) */
  onClose: () => void;
}

const EXIT_MS = 250;
/** 핸들을 이만큼 끌어올리면 확장, 끌어내리면 원래 높이로 */
const DRAG_THRESHOLD_PX = 40;

// 바텀시트 (화면설계서 공통): 위로 슬라이드 인 / 아래로 슬라이드 아웃, 딤 화면 최하단, 핸들을 당겨 확장, X로 닫기
// 앱 틀 너비 안에 붙이고, 부모 transform 영향을 받지 않도록 body에 그린다
function BottomSheet({ title, children, onClose }: BottomSheetProps) {
  const titleId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    // preventScroll: 포커스를 옮기며 화면이 스크롤돼 슬라이드 인이 흔들리지 않게
    panelRef.current?.focus({ preventScroll: true });
    return () => previousFocus?.focus({ preventScroll: true });
  }, []);

  // 부모가 다시 그려져 onClose가 바뀌어도 닫힘 타이머를 새로 걸지 않는다
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => onCloseRef.current(), EXIT_MS);
    return () => clearTimeout(timer);
  }, [isClosing]);

  const close = () => setIsClosing(true);

  const handlePointerDown = (event: PointerEvent) => {
    dragStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent) => {
    const startY = dragStartYRef.current;
    dragStartYRef.current = null;
    if (startY === null) return;
    const delta = startY - event.clientY;
    if (delta > DRAG_THRESHOLD_PX) setIsExpanded(true);
    else if (delta < -DRAG_THRESHOLD_PX) setIsExpanded(false);
    // 거의 움직이지 않았으면 탭으로 보고 확장/축소를 바꾼다
    else if (Math.abs(delta) < 5) setIsExpanded((prev) => !prev);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center">
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-250',
          isClosing && 'opacity-0',
        )}
      />
      <div className="relative flex w-full flex-col justify-end tablet:max-w-app-tablet desktop:max-w-app-desktop">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            'flex flex-col rounded-t-2xl bg-white transition-[max-height,transform] duration-250 outline-none',
            isExpanded ? 'h-[90dvh] max-h-[90dvh]' : 'max-h-[60dvh]',
            isClosing ? 'translate-y-full' : 'animate-sheet-in',
          )}
        >
          <button
            type="button"
            aria-label={isExpanded ? '시트 줄이기' : '시트 늘리기'}
            className="flex shrink-0 touch-none justify-center py-3"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <span className="h-1 w-10 rounded-full bg-gray-300" />
          </button>
          <div className="flex shrink-0 items-center justify-between px-7 pb-3">
            <h2 id={titleId} className="font-bold">
              {title}
            </h2>
            <button type="button" aria-label="닫기" onClick={close}>
              <CloseIcon />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-8">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default BottomSheet;
