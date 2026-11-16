import { apiClient, unwrap } from '@/apis/client';
import type { ApiResponse } from '@/apis/types';
import type { SignupRequest, SignupResponse } from './auth.types';

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

/**
 * 이름 입력 회원가입. 카카오 로그인에서 받은 가입 대기 세션(10분)이 있어야 한다
 * 성공하면 가입한 회원으로 로그인된다. 실패 코드는 SignupErrorCode
 */
export const signup = (request: SignupRequest): Promise<SignupResponse> =>
  apiClient.post<ApiResponse<SignupResponse>>('/api/members/signup', request).then(unwrap);

/** 로그아웃 (서비스 로그인만 끝낸다. 카카오 계정은 로그아웃하지 않는다). 로그인 안 한 상태여도 성공한다 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
};
