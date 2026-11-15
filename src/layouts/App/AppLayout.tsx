import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useStore } from 'zustand';
import NetworkErrorPage from '@/components/NetworkErrorPage';
import Toaster from '@/components/Toaster';
import { useSyncOverlayWithHistory } from '@/hooks/useOverlay';
import type { LandingState } from '@/libs/loginReturnPath';
import { networkErrorStore } from '@/libs/networkError';
import { clearSessionExpired, sessionStore } from '@/libs/session';
import { useGnbDrawerStore } from '@/stores/gnbDrawerStore';
import DisclosureCreateOverlay from '@/overlays/DisclosureCreate/DisclosureCreateOverlay';
import LeagueCreateOverlay from '@/overlays/LeagueCreate/LeagueCreateOverlay';
import LeagueJoinOverlay from '@/overlays/LeagueJoin/LeagueJoinOverlay';
import OrderOverlay from '@/overlays/Order/OrderOverlay';
import StockListingOverlay from '@/overlays/StockListing/StockListingOverlay';
import { useOverlayStore, type Overlay } from '@/stores/overlayStore';
import AppFrame from './AppFrame';

const renderOverlay = (overlay: Overlay) => {
  switch (overlay.type) {
    case 'leagueCreate':
      return <LeagueCreateOverlay />;
    case 'leagueJoin':
      return <LeagueJoinOverlay />;
    case 'stockListing':
      return <StockListingOverlay roomId={overlay.roomId} />;
    case 'order':
      return <OrderOverlay roomId={overlay.roomId} stockId={overlay.stockId} side={overlay.side} />;
    case 'disclosureCreate':
      return <DisclosureCreateOverlay roomId={overlay.roomId} />;
  }
};

// 모든 화면의 바깥 틀
// 작업형 화면(오버레이)은 주소 없이 지금 화면 위에 덮는다. 아래 화면은 그대로라 스크롤·차트 실시간이 유지된다
// 토스트·네트워크 오류도 이 틀 안에 띄운다
function AppLayout() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearGnbDrawer = useGnbDrawerStore((state) => state.clearGnbDrawer);
  const overlay = useOverlayStore((state) => state.overlay);
  const hasNetworkError = useStore(networkErrorStore, (state) => state.hasNetworkError);
  const isSessionExpired = useStore(sessionStore, (state) => state.isExpired);
  useSyncOverlayWithHistory();

  // 세션 만료 (공통 2-2): 랜딩으로 보내고 그 위에 재로그인 모달을 띄운다
  // 보던 주소를 넘겨서, 재로그인 모달로 로그인하면 보던 화면으로 돌아온다
  // 오버레이는 주소를 바꾸지 않으므로 지금 주소가 곧 오버레이를 닫은 화면의 주소다 (오버레이는 이동하며 닫힌다)
  useEffect(() => {
    if (!isSessionExpired) return;
    clearSessionExpired();
    // 랜딩에서 이미 확인한 경우(로그인 확인 요청)는 따로 보내지 않는다
    if (pathname === '/') return;
    // 이전 사용자의 캐시를 비운다. 남아 있으면 랜딩이 예전 "로그인됨" 결과를 보고 다시 앱으로 보낸다
    queryClient.clear();
    clearGnbDrawer();
    const landingState: LandingState = { returnPath: pathname + search, isSessionExpired: true };
    navigate('/', { replace: true, state: landingState });
  }, [isSessionExpired, pathname, search, navigate, queryClient, clearGnbDrawer]);

  return (
    <AppFrame>
      <Outlet />
      {overlay && (
        // 작업형 화면끼리 바뀌면(새 리그 ↔ 코드로 참여) 새로 그린다
        // 애니메이션 없이 바로 덮는다 (슬라이드 중에 레이아웃이 흔들려 보여서 뺐다)
        <div key={overlay.type} className="absolute inset-0 z-35 flex flex-col bg-white">
          {renderOverlay(overlay)}
        </div>
      )}
      {hasNetworkError && <NetworkErrorPage />}
      <Toaster />
    </AppFrame>
  );
}

export default AppLayout;
