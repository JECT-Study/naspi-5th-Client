import { delay } from '@/mocks/delay';

/** 카카오 로그인 시작 주소 (백엔드 Spring Security가 처리한다. Swagger에는 없다) */
const KAKAO_LOGIN_URL = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/kakao`;

/**
 * 카카오 로그인 시작: API 호출이 아니라 페이지 이동이다
 * 백엔드 → 카카오 로그인 → 백엔드가 결과에 따라 우리 화면으로 다시 보낸다
 * - 성공: /  (로그인돼 있으면 메인으로 간다)
 * - 이름 입력 필요(카카오 이름에 한글이 없는 신규 회원): /signup
 * - 실패: /login-failure
 * fetch로 부르면 카카오 화면으로 넘어가지 못하고 CORS에 막히므로 꼭 페이지를 이동한다
 */
export const startKakaoLogin = () => {
  window.location.assign(KAKAO_LOGIN_URL);
};

// TODO: API가 준비되면 apiClient 호출로 바꾼다
export const logout = async (): Promise<void> => {
  await delay(300);
};
