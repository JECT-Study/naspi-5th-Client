import { useNavigate } from 'react-router';
import LoginModal from '@/components/LoginModal';

// 랜딩: 로그인 모달(공통 2)을 띄운다. 로그인하면 메인(진행 중인 리그)으로 간다
// TODO: 랜딩 화면(서비스 소개)이 화면설계서에 생기면 모달 뒤 배경을 채운다
function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <LoginModal variant="login" onLoggedIn={() => navigate('/leagues', { replace: true })} />
    </main>
  );
}

export default LandingPage;
