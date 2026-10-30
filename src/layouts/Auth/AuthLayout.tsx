import { Outlet } from 'react-router';

// 로그인 후 화면의 바깥 틀: 로그인 가드 + 햄버거로 여는 사이드 메뉴를 한 번만 렌더링한다
// 로그인 가드는 인증 방식(쿠키/토큰)이 백엔드와 정해지면 추가한다
function AuthLayout() {
  return <Outlet />;
}

export default AuthLayout;
