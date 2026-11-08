import { useQueryClient } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router';
import { useStore } from 'zustand';
import LoginModal from '@/components/LoginModal';
import NetworkErrorPage from '@/components/NetworkErrorPage';
import Toaster from '@/components/Toaster';
import { useSyncOverlayWithHistory } from '@/hooks/useOverlay';
import { networkErrorStore } from '@/libs/networkError';
import { clearSessionExpired, sessionStore } from '@/libs/session';
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
      return <LeagueJoinOverlay initialInviteCode={overlay.inviteCode} />;
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
// 토스트·네트워크 오류·재로그인 안내도 이 틀 안에 띄운다
function AppLayout() {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const overlay = useOverlayStore((state) => state.overlay);
  const hasNetworkError = useStore(networkErrorStore, (state) => state.hasNetworkError);
  const isSessionExpired = useStore(sessionStore, (state) => state.isExpired);
  useSyncOverlayWithHistory();

  // 재로그인하면 지금 화면에서 실패했던 조회를 다시 한다
  const handleRelogin = () => {
    clearSessionExpired();
    queryClient.invalidateQueries();
  };

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
      {/* 랜딩에서는 원래 로그인 모달이 떠 있으므로 띄우지 않는다 (공통 2-2) */}
      {isSessionExpired && pathname !== '/' && (
        <LoginModal variant="expired" onLoggedIn={handleRelogin} />
      )}
      <Toaster />
    </AppFrame>
  );
}

export default AppLayout;
