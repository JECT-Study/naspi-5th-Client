import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import { Link } from 'react-router';
import { TOAST_EXIT_MS, toastStore, type ToastItem, type ToastType } from '@/libs/notify';
import { AlertCircleIcon, CheckBoxFilledIcon, SpeakerIcon } from '@/components/ui/icons';
import { cn } from '@/utils/cn';

/** 화면설계서 공통: 2초 표시 후 자동으로 닫힘 */
const TOAST_DURATION_MS = 2000;
/** 겹쳐 있을 때 보이는 토스트 수 (맨 앞 + 뒤로 2개) */
const VISIBLE_TOASTS = 3;
/** 겹쳐 있을 때 뒤 토스트가 앞 토스트 위로 삐져나오는 높이 */
const PEEK = 10;
/** 겹쳐 있을 때 한 칸 뒤로 갈 때마다 줄어드는 비율 */
const SCALE_STEP = 0.05;
/** 펼쳤을 때 토스트 사이 간격 */
const GAP = 8;
/** 움직이는 시간 (sonner와 같은 0.4초) */
const MOVE_MS = 400;

interface ToastLayout {
  y: number;
  scale: number;
  /** 겹쳐 있는 뒤 토스트는 앞 토스트 높이로 자른다. 없으면 원래 높이 */
  height?: number;
  isHidden: boolean;
}

// 시안 Toast: 성공 CheckBox 24, 오류 Notice 24, 새 거래일 speaker 24 (모두 흰색)
function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return <CheckBoxFilledIcon />;
  if (type === 'error') return <AlertCircleIcon />;
  return <SpeakerIcon />;
}

interface ToastRowProps {
  toast: ToastItem;
  index: number;
  layout: ToastLayout;
  /** 펼쳐 보는 동안은 자동으로 닫히지 않는다 */
  isPaused: boolean;
  onHeight: (id: number, height: number) => void;
}

// 토스트 한 개. 2초 뒤 닫히기 시작한다 (펼쳐 보는 동안은 멈춤)
function ToastRow({ toast, index, layout, isPaused, onHeight }: ToastRowProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { y, scale, height, isHidden } = layout;
  const remainingRef = useRef(TOAST_DURATION_MS);

  // 원래 높이를 알려 준다 (겹친 뒤 토스트 자르기·펼친 자리 계산용)
  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const report = () => onHeight(toast.id, element.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(element);
    return () => observer.disconnect();
  }, [toast.id, onHeight]);

  // 처음 그린 다음 프레임에 제자리로 옮겨 나타나는 애니메이션을 만든다
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // 남은 시간만큼 기다렸다 닫는다. 멈추면 지난 시간만큼 남은 시간을 줄인다
  useEffect(() => {
    if (isPaused || toast.isLeaving) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => toastStore.dismiss(toast.id), remainingRef.current);
    return () => {
      clearTimeout(timer);
      remainingRef.current -= Date.now() - startedAt;
    };
  }, [isPaused, toast.isLeaving, toast.id]);

  let transform = `translateY(${y}px) scale(${scale})`;
  let opacity = isHidden ? 0 : 1;
  // 나타날 때: 제자리보다 조금 아래에서 떠오르며 페이드 인 / 닫힐 때: 조금 작아지며 페이드 아웃
  if (!isMounted) {
    transform = `translateY(${y + 12}px) scale(${scale})`;
    opacity = 0;
  } else if (toast.isLeaving) {
    transform = `translateY(${y}px) scale(${scale * 0.96})`;
    opacity = 0;
  }

  const style: CSSProperties = {
    transform,
    opacity,
    height,
    zIndex: index + 1,
    transitionDuration: `${toast.isLeaving ? TOAST_EXIT_MS : MOVE_MS}ms`,
  };

  return (
    <li
      aria-hidden={isHidden || undefined}
      className={cn(
        'absolute inset-x-0 top-0 origin-top overflow-hidden rounded-lg transition-[transform,opacity,height] ease-[cubic-bezier(0.21,1.02,0.73,1)] motion-reduce:transition-none',
        (isHidden || toast.isLeaving) && 'pointer-events-none',
      )}
      style={style}
    >
      {/* 시안 Toast (160:8644): 폭 320, 모서리 8, Grey/6 바탕, 여백 14·17, 아이콘 24 + 간격 4 + Button2.5 흰 글자(2줄까지)
          링크("확인하기")는 오른쪽 Button2.5 NSBlue(Light) */}
      <div
        ref={contentRef}
        role={toast.type === 'error' ? 'alert' : 'status'}
        className="pointer-events-auto flex items-center gap-1 rounded-lg bg-grey-6 px-4.25 py-3.5 text-button2-5 text-white"
      >
        <ToastIcon type={toast.type} />
        <p className="line-clamp-2 min-w-0 flex-1">{toast.message}</p>
        {toast.link && (
          // 링크를 누르면 이동하고 토스트는 바로 닫는다 (설계서 토스트 공통 인터랙션)
          <Link
            to={toast.link.to}
            className="shrink-0 text-ns-blue-light"
            onClick={() => toastStore.dismiss(toast.id)}
          >
            {toast.link.label}
          </Link>
        )}
      </div>
    </li>
  );
}

// notify.success / error / announce로 띄운 알림을 앱 화면 위쪽 가운데에 보여준다. AppLayout에 한 번만 둔다
// 설계서 토스트 공통 인터랙션: 2초 뒤 자동으로 닫힘, 페이드 인·아웃, 새 토스트는 기존 토스트 아래에 추가,
// 위 토스트가 닫히면 아래 토스트가 위로 슬라이드해 빈 자리를 없앤다
// 여러 개면 sonner처럼 겹쳐 쌓는다: 새 토스트가 맨 앞(원래 크기, 아래), 기존 토스트는 작아져 그 뒤 위쪽으로 살짝 보인다
// 마우스를 올리면(휴대폰은 누르면) 펼쳐서 모두 보여 주고, 그동안 자동으로 닫히지 않는다
function Toaster() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getSnapshot,
  );
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleHeight = useCallback((id: number, height: number) => {
    setHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }));
  }, []);

  // 닫히는 중인 토스트를 빼고 자리를 정한다 (나머지가 바로 새 자리로 옮겨 간다)
  const active = toasts.filter((toast) => !toast.isLeaving);
  // 토스트가 다 닫히면 접는다 (렌더 중에 바로 고친다)
  if (active.length === 0 && isExpanded) setIsExpanded(false);

  /** 목록 순서(먼저 뜬 것이 앞)대로 각 토스트의 자리를 정한다 */
  const getLayouts = (list: readonly ToastItem[]) => {
    const layouts = new Map<number, ToastLayout>();
    const visibleCount = Math.min(list.length, VISIBLE_TOASTS);
    const front = list.at(-1);
    const frontHeight = front ? (heights[front.id] ?? 0) : 0;
    let expandedY = 0;
    list.forEach((toast, index) => {
      // 0이면 맨 앞(가장 새 토스트), 클수록 오래된 토스트
      const depth = list.length - 1 - index;
      if (isExpanded) {
        layouts.set(toast.id, { y: expandedY, scale: 1, isHidden: false });
        expandedY += (heights[toast.id] ?? 0) + GAP;
        return;
      }
      layouts.set(toast.id, {
        y: Math.max(0, visibleCount - 1 - depth) * PEEK,
        scale: 1 - Math.min(depth, VISIBLE_TOASTS - 1) * SCALE_STEP,
        height: depth > 0 ? frontHeight : undefined,
        isHidden: depth >= VISIBLE_TOASTS,
      });
    });
    // 펼침·겹침 영역 높이 (마우스를 올릴 수 있는 범위)
    const areaHeight = isExpanded
      ? Math.max(0, expandedY - GAP)
      : frontHeight + Math.max(0, visibleCount - 1) * PEEK;
    return { layouts, areaHeight };
  };
  const { layouts, areaHeight } = getLayouts(active);
  // 닫히는 토스트는 닫히기 직전 자리(자기를 포함한 목록 기준)에서 사라진다
  const { layouts: leavingLayouts } = getLayouts(toasts);

  return (
    // 위에서 16 (시안에 없음, 기존 값). 모달·오버레이보다 위에 보인다. 토스트 밖은 눌러도 아래 화면이 눌린다
    <section
      aria-label="알림"
      className="pointer-events-none absolute inset-x-0 top-4 z-60 flex justify-center px-4"
    >
      <ol
        aria-live="polite"
        className="pointer-events-auto relative w-80 max-w-full transition-[height] duration-400 ease-[cubic-bezier(0.21,1.02,0.73,1)] motion-reduce:transition-none"
        style={{ height: areaHeight }}
        onMouseEnter={() => active.length > 1 && setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {toasts.map((toast, index) => (
          <ToastRow
            key={toast.id}
            toast={toast}
            index={index}
            layout={
              (toast.isLeaving ? leavingLayouts : layouts).get(toast.id) ?? {
                y: 0,
                scale: 1,
                isHidden: true,
              }
            }
            isPaused={isExpanded}
            onHeight={handleHeight}
          />
        ))}
      </ol>
    </section>
  );
}

export default Toaster;
