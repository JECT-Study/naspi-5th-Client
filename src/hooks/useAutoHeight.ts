import { useLayoutEffect, type RefObject } from 'react';

/**
 * 여러 줄 입력칸의 높이를 내용에 맞춘다 (댓글, 공시 제목)
 * 값이 바뀔 때마다 높이를 풀었다가 내용 높이(scrollHeight)로 다시 맞춘다
 */
export const useAutoHeight = (ref: RefObject<HTMLTextAreaElement | null>, value: string) => {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [ref, value]);
};
