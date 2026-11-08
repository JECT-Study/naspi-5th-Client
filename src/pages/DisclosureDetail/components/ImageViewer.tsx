import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, RetryIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

interface ImageViewerProps {
  images: string[];
  /** 처음 보여줄 사진 (누른 사진) */
  initialIndex: number;
  onClose: () => void;
}

/** 이만큼(px) 넘게 밀면 다음·이전 사진으로 넘긴다 */
const SWIPE_THRESHOLD = 50;

// 사진 한 장: 못 불러오면 그 자리에서 다시 시도 (공시 상세 3-2)
function Slide({ src }: { src: string }) {
  const [hasError, setHasError] = useState(false);
  // 다시 시도할 때 img를 새로 그려 다시 요청하게 한다
  const [attempt, setAttempt] = useState(0);

  return (
    <div className="flex h-full w-full shrink-0 items-center justify-center">
      {hasError ? (
        <div className="flex flex-col items-center gap-3 text-sm text-white">
          <p>이미지를 불러오지 못했어요.</p>
          <button
            type="button"
            className="flex items-center gap-1 text-xs underline"
            onClick={() => {
              setHasError(false);
              setAttempt((prev) => prev + 1);
            }}
          >
            <RetryIcon className="size-3.5" />
            다시 시도
          </button>
        </div>
      ) : (
        <img
          key={attempt}
          src={src}
          alt=""
          draggable={false}
          className="max-h-full max-w-full object-contain select-none"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

// 이미지 확장 (공시 상세 3-1): 검은 화면에 사진을 크게, 위에는 {현재 번호}/{전체 수}
// 왼쪽으로 밀면 다음 사진, 오른쪽으로 밀면 이전 사진. 미는 동안 손가락을 따라 움직인다
// X 버튼(또는 ESC)을 누르면 닫히고 공시 상세로 돌아간다. PC에서는 ←/→ 키로도 넘긴다
function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  // 미는 중에는 손가락을 바로 따라오게 전환 애니메이션을 끈다
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<number | null>(null);
  const lastIndex = images.length - 1;

  const goTo = (next: number) => setIndex(Math.min(Math.max(next, 0), lastIndex));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((prev) => Math.min(prev + 1, lastIndex));
      if (event.key === 'ArrowLeft') setIndex((prev) => Math.max(prev - 1, 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, lastIndex]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    let offset = event.clientX - dragStartRef.current;
    // 첫 사진에서 오른쪽, 마지막 사진에서 왼쪽으로는 조금만 따라오게 한다 (더 없다는 느낌)
    if ((index === 0 && offset > 0) || (index === lastIndex && offset < 0)) offset /= 3;
    setDragOffset(offset);
  };

  const handlePointerEnd = () => {
    if (dragStartRef.current === null) return;
    if (dragOffset <= -SWIPE_THRESHOLD) goTo(index + 1);
    else if (dragOffset >= SWIPE_THRESHOLD) goTo(index - 1);
    dragStartRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      <header className="relative flex h-16 shrink-0 items-center justify-center text-sm text-white">
        <button
          type="button"
          aria-label="닫기"
          className="absolute top-1/2 left-6 -translate-y-1/2"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
        {/* 사진 전환 시 현재 번호 갱신 */}
        <span aria-live="polite">
          {index + 1}/{images.length}
        </span>
      </header>
      <div
        className="min-h-0 flex-1 touch-pan-y overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          className={cn('flex h-full', !isDragging && 'transition-transform duration-300 ease-out')}
          style={{ transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))` }}
        >
          {images.map((src) => (
            <Slide key={src} src={src} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ImageViewer;
