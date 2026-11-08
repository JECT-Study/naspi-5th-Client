import { useEffect, useState } from 'react';

/** 처리 중 표시를 띄우기 전 기다리는 시간 (화면설계서: 지연이 0.3초를 넘을 때만 "생성 중..." 등을 보여준다) */
export const PENDING_INDICATOR_DELAY_MS = 300;

/**
 * flag가 delayMs 동안 계속 true일 때만 true. 빨리 끝나는 요청에서 "처리 중" 문구가 깜빡이지 않게 한다
 * 예: const showsPending = useDelayedFlag(isPending)
 */
export function useDelayedFlag(flag: boolean, delayMs = PENDING_INDICATOR_DELAY_MS): boolean {
  const [hasElapsed, setHasElapsed] = useState(false);

  useEffect(() => {
    if (!flag) return;
    const timer = setTimeout(() => setHasElapsed(true), delayMs);
    return () => {
      clearTimeout(timer);
      setHasElapsed(false);
    };
  }, [flag, delayMs]);

  return flag && hasElapsed;
}
