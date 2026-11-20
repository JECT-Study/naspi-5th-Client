import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type TransitionEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useContainTouchScroll } from '@/hooks/useContainTouchScroll';
import { cn } from '@/utils/cn';
import { getOverlayRoot } from './appFrame';
import { CloseIcon } from '@/components/ui/icons';

interface BottomSheetProps {
  title: string;
  children: ReactNode;
  /** 슬라이드 아웃이 끝난 뒤 불린다. 부르는 쪽은 여기서 시트를 내린다(조건부 렌더링) */
  onClose: () => void;
}

const EXIT_MS = 250;
/** 이만큼 끌어올리고 놓으면 확장, 끌어내리고 놓으면 축소. 덜 끌었으면 끌기 전 높이로 돌아간다 */
const DRAG_THRESHOLD_PX = 40;
const EXPANDED_HEIGHT = '90dvh';
const EXPANDED_HEIGHT_RATIO = 0.9;
/** 놓았을 때 접힌 높이의 이 비율 이상 내려가 있으면 닫는다 */
const CLOSE_DRAG_RATIO = 0.25;
/** 접힌 상태에서 이 속도(px/ms) 이상으로 튕겨 내리면 짧게 끌어도 닫는다 */
const CLOSE_FLICK_VELOCITY = 0.4;

interface SheetDrag {
  startY: number;
  startTime: number;
  startHeight: number;
  isHandle: boolean;
}

// 바텀시트 (화면설계서 공통): 위로 슬라이드 인 / 아래로 슬라이드 아웃, 딤 화면 최하단, 올려 확장·내려 축소, X·바깥 클릭·아래로 끌어 닫기
// 부모 transform 영향을 받지 않도록 앱 틀에 바로 그린다. 어두운 배경은 앱 틀만 덮는다 (components/appFrame)
function BottomSheet({ title, children, onClose }: BottomSheetProps) {
  const titleId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  // null이면 내용에 맞는 높이. auto와 길이 사이는 애니메이션이 안 되어 끌거나 줄어드는 동안에는 값을 직접 넣는다
  const [sheetHeight, setSheetHeight] = useState<string | null>(null);
  // 접힌 높이 아래로 끈 거리. 높이를 더 줄이면 내용이 찌그러져 보여 시트를 통째로 밀어 내린다
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<SheetDrag | null>(null);
  const collapsedHeightRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useContainTouchScroll(rootRef, contentRef);

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

  const getPanelHeight = () => panelRef.current?.getBoundingClientRect().height ?? 0;

  const closeByDrag = () => {
    setIsDragging(false);
    setDragOffset(0);
    close();
  };

  const settle = (expanded: boolean) => {
    setIsDragging(false);
    setDragOffset(0);
    setIsExpanded(expanded);
    const collapsedHeight = collapsedHeightRef.current;
    if (expanded) setSheetHeight(EXPANDED_HEIGHT);
    // 이미 접힌 높이면 전환이 일어나지 않아 transitionend가 오지 않으므로 여기서 되돌린다
    else if (Math.abs(getPanelHeight() - collapsedHeight) < 1) setSheetHeight(null);
    else setSheetHeight(`${collapsedHeight}px`);
  };

  // 시트 윗부분(핸들·X 줄)을 끄는 동안 높이가 따라온다. 내용 영역은 스크롤에 쓴다. X 버튼은 끌기에서 뺀다
  const handlePointerDown = (event: PointerEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-sheet-close]')) return;
    const height = getPanelHeight();
    if (sheetHeight === null) collapsedHeightRef.current = height;
    // 포인터를 잡으면 이후 이벤트의 target이 이 영역으로 바뀌므로 핸들 여부는 지금 기억한다
    dragRef.current = {
      startY: event.clientY,
      startTime: event.timeStamp,
      startHeight: height,
      isHandle: Boolean(target.closest('[data-sheet-handle]')),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setSheetHeight(`${height}px`);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const maxHeight = window.innerHeight * EXPANDED_HEIGHT_RATIO;
    const collapsedHeight = collapsedHeightRef.current;
    const nextHeight = drag.startHeight + drag.startY - event.clientY;
    setSheetHeight(`${Math.min(maxHeight, Math.max(collapsedHeight, nextHeight))}px`);
    setDragOffset(Math.max(0, collapsedHeight - nextHeight));
  };

  const handlePointerUp = (event: PointerEvent) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const delta = drag.startY - event.clientY;
    const releasedHeight = drag.startHeight + delta;
    const velocity = -delta / Math.max(1, event.timeStamp - drag.startTime);
    const isFlickDown =
      !isExpanded && -delta > DRAG_THRESHOLD_PX && velocity >= CLOSE_FLICK_VELOCITY;
    if (releasedHeight <= collapsedHeightRef.current * (1 - CLOSE_DRAG_RATIO) || isFlickDown) {
      closeByDrag();
    } else if (delta > DRAG_THRESHOLD_PX) settle(true);
    else if (delta < -DRAG_THRESHOLD_PX) settle(false);
    // 핸들을 거의 움직이지 않고 눌렀으면 탭으로 보고 확장/축소를 바꾼다
    else if (Math.abs(delta) < 5 && drag.isHandle) settle(!isExpanded);
    else settle(isExpanded);
  };

  const handlePointerCancel = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    settle(isExpanded);
  };

  const handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'height') return;
    if (!isExpanded) setSheetHeight(null);
  };

  return createPortal(
    <div ref={rootRef} className="absolute inset-0 z-50 flex justify-center">
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-250',
          isClosing && 'opacity-0',
        )}
        onClick={close}
      />
      {/* 이 틀은 위치만 잡는다: 빈 곳의 클릭이 뒤의 어두운 배경까지 가야 바깥을 눌러 닫을 수 있다 */}
      <div className="pointer-events-none relative flex w-full max-w-app flex-col justify-end">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          style={{
            height: sheetHeight ?? undefined,
            translate: dragOffset > 0 ? `0 ${dragOffset}px` : undefined,
          }}
          onTransitionEnd={handleTransitionEnd}
          // 시안 (리그 결과 참여자 최종 자산): 위쪽 모서리 16, 흰색, ModalShadow
          className={cn(
            'pointer-events-auto flex flex-col rounded-t-2xl bg-white shadow-modal outline-none',
            // 끄는 동안 전환이 걸리면 시트가 손가락보다 늦게 따라온다. duration만 남아도 모든 속성에 전환이 걸린다
            !isDragging && 'transition-[height,translate] duration-250',
            sheetHeight === null ? 'max-h-[60dvh]' : 'max-h-[90dvh]',
            isClosing ? 'translate-y-full' : 'animate-sheet-in',
          )}
        >
          <div
            // select-none: 끄는 동안 제목이 선택되면 다음 끌기가 글자 옮기기로 취소된다
            className="flex shrink-0 touch-none flex-col select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            {/* 손잡이 막대는 시안에 없지만 끌어서 늘리고 줄이는 동작을 알려 주려고 둔다 (사용자 결정) */}
            <button
              type="button"
              data-sheet-handle
              aria-label={isExpanded ? '시트 줄이기' : '시트 늘리기'}
              className="flex justify-center py-3"
            >
              <span className="h-1 w-10 rounded-full bg-grey-3" />
            </button>
            {/* 시안: 맨 위 오른쪽 닫기 X 24 (시트 좌우 여백 16) */}
            <div className="flex justify-end px-4">
              <button type="button" data-sheet-close aria-label="닫기" onClick={close}>
                <CloseIcon className="text-grey-8" />
              </button>
            </div>
          </div>
          {/* 시안: X 줄 아래 12, 내용은 시트 여백 16 + 8 들여 쓰고 맨 아래 50 비움. 제목(Title3 Grey/8)이 내용 첫 줄 */}
          <div
            ref={contentRef}
            className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-6 pb-12.5"
          >
            <h2 id={titleId} className="text-title3 text-grey-8">
              {title}
            </h2>
            {children}
          </div>
        </div>
      </div>
    </div>,
    getOverlayRoot(),
  );
}

export default BottomSheet;
