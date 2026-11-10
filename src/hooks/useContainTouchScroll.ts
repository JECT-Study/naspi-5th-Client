import { useEffect, type RefObject } from 'react';

/**
 * 터치 스크롤을 root 안에 가둔다. scroller 밖을 밀거나, scroller가 끝에 닿아 더 못 움직이는 방향으로 밀면
 * 뒤 화면이 스크롤되지 않게 막는다 (CSS만으로는 iOS Safari에서 뒤 화면까지 넘어간다)
 * React의 터치 핸들러는 preventDefault를 쓸 수 없어 직접 등록한다
 */
export function useContainTouchScroll(
  rootRef: RefObject<HTMLElement | null>,
  scrollerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let lastY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      lastY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? lastY;
      const deltaY = y - lastY;
      lastY = y;
      if (!event.cancelable) return;

      const scroller = scrollerRef.current;
      if (scroller?.contains(event.target as Node)) {
        const isAtTop = scroller.scrollTop <= 0;
        const isAtBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
        const isBlocked = (deltaY > 0 && isAtTop) || (deltaY < 0 && isAtBottom);
        if (!isBlocked) return;
      }
      event.preventDefault();
    };

    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      root.removeEventListener('touchstart', handleTouchStart);
      root.removeEventListener('touchmove', handleTouchMove);
    };
  }, [rootRef, scrollerRef]);
}
