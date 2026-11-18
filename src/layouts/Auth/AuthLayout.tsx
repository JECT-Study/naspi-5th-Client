import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router';
import { userQueries } from '@/apis/domains/user/user.queries';
import ErrorPage from '@/components/ErrorPage';
import { isSessionEndedError } from '@/libs/apiError';
import type { LandingState } from '@/libs/loginReturnPath';
import { useGnbDrawerStore } from '@/stores/gnbDrawerStore';
import GnbDrawer from './components/GnbDrawer';
import LogoutModal from './components/LogoutModal';
import WithdrawModal from './components/WithdrawModal';

// 로그인 후 화면의 바깥 틀: 로그인 가드 + 햄버거로 여는 GNB 드로어와 드로어 메뉴의 모달을 한 번만 렌더링한다
// 로그인 가드: 내 이름 조회(GET /api/members/me/name)로 로그인 여부를 확인한다
// - 확인 중: 아무것도 그리지 않는다 (안쪽 화면의 조회가 로그인 확인 뒤에 시작된다)
// - 로그인 안 함·탈퇴(401, 003, 103): 랜딩으로 보낸다. 들어오려던 주소를 넘겨서 로그인 후 그리로 돌아오게 한다
//   (예: 친구가 공유한 공시 링크 /leagues/3/disclosures/5 를 로그인 전에 열어도 로그인 후 그 공시로 간다)
// - 그 밖의 실패(서버 오류 등): 로그인 여부를 알 수 없어 [공통 오류] 페이지 (공통 7)
//   '메인 페이지로 이동'을 누르면 로그인 확인을 다시 한다. 인터넷 끊김은 네트워크 오류 페이지가 덮는다 (libs/queryClient)
function AuthLayout() {
  const { pathname, search } = useLocation();
  const me = useQuery(userQueries.me());
  const isGnbDrawerOpen = useGnbDrawerStore((state) => state.isOpen);
  const gnbModal = useGnbDrawerStore((state) => state.modal);
  const closeGnbModal = useGnbDrawerStore((state) => state.closeGnbModal);

  if (me.isPending) return null;
  if (me.isError) {
    if (isSessionEndedError(me.error)) {
      const landingState: LandingState = { returnPath: pathname + search };
      return <Navigate to="/" replace state={landingState} />;
    }
    return <ErrorPage onMoveToMain={() => me.refetch()} />;
  }

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
