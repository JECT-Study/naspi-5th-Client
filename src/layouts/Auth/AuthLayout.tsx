import { Outlet } from 'react-router';
import { useGnbDrawerStore } from '@/stores/gnbDrawerStore';
import GnbDrawer from './components/GnbDrawer';
import LogoutModal from './components/LogoutModal';
import WithdrawModal from './components/WithdrawModal';

// 로그인 후 화면의 바깥 틀: 로그인 가드 + 햄버거로 여는 GNB 드로어와 드로어 메뉴의 모달을 한 번만 렌더링한다
// 로그인 가드는 인증 방식(쿠키/토큰)이 백엔드와 정해지면 추가한다
function AuthLayout() {
  const isGnbDrawerOpen = useGnbDrawerStore((state) => state.isOpen);
  const gnbModal = useGnbDrawerStore((state) => state.modal);
  const closeGnbModal = useGnbDrawerStore((state) => state.closeGnbModal);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Outlet />
      {isGnbDrawerOpen && <GnbDrawer />}
      {gnbModal === 'logout' && <LogoutModal onClose={closeGnbModal} />}
      {gnbModal === 'withdraw' && <WithdrawModal onClose={closeGnbModal} />}
    </div>
  );
}

export default AuthLayout;
