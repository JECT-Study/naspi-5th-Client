import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router';
import { useOverlayStore, type Overlay } from '@/stores/overlayStore';
import { hasPreviousPage } from './useGoBack';

// 작업형 화면(새 리그, 코드로 참여, 종목 상장, 주문, 공시 쓰기)을 주소 없이 지금 화면 위에 띄운다
// 열 때 같은 주소로 기록을 하나 남겨서, 뒤로 가기를 누르면 그 기록이 빠지며 오버레이만 닫힌다
// 어떤 오버레이인지는 overlayStore가 들고, 그리는 일은 AppLayout이 한다

const OVERLAY_HISTORY_KEY = 'overlay';
const FORCED_NAVIGATION_KEY = 'forced';

/**
 * 막지 말아야 하는 이동(리그 시작·종료로 화면을 옮길 때)의 navigate state
 * 작성 중 확인(useBlocker)이 있는 오버레이도 이 이동은 막지 않는다
 */
export const forcedNavigationState = { [FORCED_NAVIGATION_KEY]: true };

export const isForcedNavigation = (location: Location) =>
  Boolean((location.state as Record<string, unknown> | null)?.[FORCED_NAVIGATION_KEY]);

const isOverlayEntry = (location: Location) =>
  Boolean((location.state as Record<string, unknown> | null)?.[OVERLAY_HISTORY_KEY]);

const toPath = ({ pathname, search, hash }: Location) => ({ pathname, search, hash });

interface OpenOverlayOptions {
  /**
   * 기록을 쌓지 않고 지금 기록을 오버레이 기록으로 바꾼다 (초대 링크로 들어온 첫 화면 등)
   * search를 함께 넘기면 주소의 쿼리도 바꾼다
   */
  replace?: boolean;
  search?: string;
}

/** 오버레이 열기. 이미 오버레이가 열려 있으면(작업형 화면끼리 전환) 기록을 더 쌓지 않는다 */
export const useOpenOverlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setOverlay = useOverlayStore((state) => state.setOverlay);

  return (overlay: Overlay, { replace = false, search }: OpenOverlayOptions = {}) => {
    setOverlay(overlay);
    if (isOverlayEntry(location) && !replace) return;
    navigate(
      { ...toPath(location), ...(search !== undefined && { search }) },
      { replace, state: { [OVERLAY_HISTORY_KEY]: true } },
    );
  };
};

/** 오버레이 닫기 (X, 작업 완료). 오버레이 기록을 빼서 뒤로 가기와 같게 닫는다 */
export const useCloseOverlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const clearOverlay = useOverlayStore((state) => state.clearOverlay);

  return () => {
    if (!isOverlayEntry(location)) {
      clearOverlay();
      return;
    }
    // 앱의 첫 기록이면 뒤로 가면 앱 밖으로 나가므로, 오버레이 표시만 지운다
    if (hasPreviousPage()) navigate(-1);
    else navigate(toPath(location), { replace: true });
  };
};

/**
 * 기록과 오버레이를 맞춘다 (AppLayout에서 한 번 부른다)
 * - 뒤로 가기·다른 화면 이동으로 오버레이 기록을 벗어나면 오버레이를 닫는다
 * - 새로고침으로 오버레이 내용은 사라졌는데 기록만 남아 있으면 그 기록을 뺀다
 */
export const useSyncOverlayWithHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // 주소(기록)가 실제로 바뀌었을 때만 맞춘다
    // 오버레이를 연 직후, 기록이 바뀌기 전에 이 effect가 먼저 돌면 열린 오버레이를 닫아 버리기 때문
    // (첫 화면의 effect에서 초대 링크 오버레이를 여는 경우 등)
    const isFirstRun = previousKeyRef.current === null;
    if (previousKeyRef.current === location.key) return;
    previousKeyRef.current = location.key;

    const { overlay, clearOverlay } = useOverlayStore.getState();
    const isEntry = isOverlayEntry(location);
    if (!isEntry && overlay && !isFirstRun) clearOverlay();
    if (isEntry && !overlay) {
      if (hasPreviousPage()) navigate(-1);
      else navigate(toPath(location), { replace: true });
    }
  }, [location, navigate]);
};
