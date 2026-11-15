import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { userQueries } from '@/apis/domains/user/user.queries';
import Button from '@/components/Button';
import LoginModal from '@/components/LoginModal';
import {
  clearLoginReturnPath,
  readLoginReturnPath,
  type LandingState,
} from '@/libs/loginReturnPath';

type LandingModal = 'login' | 'relogin';

// 랜딩
// - 이미 로그인돼 있으면 돌아갈 주소(없으면 메인)로 보낸다. 카카오 로그인 후 백엔드가 여기(/)로 보내므로 로그인 후 이동도 이것이다
// - '친구들과 시작하기' → 로그인 모달(공통 2) → 로그인하면 메인
//   (로그인 가드가 보낸 경우는 들어오려던 주소로)
// - 세션 만료로 온 경우 재로그인 모달(공통 2-2)을 바로 띄운다 → 로그인하면 보던 화면
//   재로그인 모달을 닫으면 보던 주소는 버리고, 그 뒤 '친구들과 시작하기'로 로그인하면 메인
// TODO: 랜딩 화면(서비스 소개) 디자인이 나오면 버튼 위를 채운다
function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const me = useQuery(userQueries.me());
  const landingState = location.state as LandingState | null;
  const [modal, setModal] = useState<LandingModal | null>(
    landingState?.isSessionExpired ? 'relogin' : null,
  );

  // 돌아갈 주소로 보냈으면 지운다. 다음 로그인 때 예전 주소로 가지 않게
  useEffect(() => {
    if (me.isSuccess) clearLoginReturnPath();
  }, [me.isSuccess]);

  if (me.isSuccess) return <Navigate to={readLoginReturnPath() ?? '/leagues'} replace />;

  // 재로그인 모달을 닫으면 넘겨받은 주소를 버린다 (새로고침해도 다시 뜨지 않게 기록의 state도 지운다)
  const closeRelogin = () => {
    setModal(null);
    navigate('/', { replace: true, state: null });
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col px-9 pb-10">
      {/* TODO: 랜딩 디자인이 나오면 바꾼다. 버튼 위 남는 공간의 가운데에 둔다 */}
      <p className="flex flex-1 items-center justify-center text-2xl font-bold">랜딩</p>
      {/* 로그인 확인 중에는 버튼을 숨겨서, 로그인한 사용자에게 잠깐 보였다 사라지지 않게 한다 */}
      {!me.isPending && (
        <Button className="w-full" onClick={() => setModal('login')}>
          친구들과 시작하기
        </Button>
      )}
      {modal === 'login' && (
        <LoginModal
          variant="login"
          // 로그인 가드가 보낸 경우에만 들어오려던 주소가 있다
          returnPath={landingState?.isSessionExpired ? undefined : landingState?.returnPath}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'relogin' && (
        <LoginModal
          variant="expired"
          returnPath={landingState?.returnPath}
          onClose={closeRelogin}
        />
      )}
    </main>
  );
}

export default LandingPage;
