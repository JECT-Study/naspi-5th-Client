import { useEffect, useRef } from 'react';

interface LoadMoreTriggerProps {
  /** 목록 끝이 화면 가까이 왔을 때 */
  onVisible: () => void;
}

// 무한 스크롤: 목록 맨 아래에 두면 화면에 들어올 때 다음 페이지를 부른다
// 불러오는 중·실패·마지막 페이지에는 렌더링하지 않는다. 다시 그려졌을 때 아직 보이면 한 번 더 부른다
function LoadMoreTrigger({ onVisible }: LoadMoreTriggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  useEffect(() => {
    onVisibleRef.current = onVisible;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisibleRef.current();
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}

export default LoadMoreTrigger;
