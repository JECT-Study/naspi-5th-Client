import { mockAuthServer } from '@/mocks/auth.mock';
import { delay } from '@/mocks/delay';
import type { LoginResponse } from './auth.types';

// 카카오 로그인 팝업을 열고, 인증이 끝나면(팝업이 닫히면) 로그인 결과를 받는다
// TODO: 카카오 앱 키·콜백을 누가 받는지(FE/BE) 정해지면 팝업 + apiClient 호출로 바꾼다
export const loginWithKakao = async (): Promise<LoginResponse> => {
  await delay(800);
  return mockAuthServer.login();
};

// TODO: API가 준비되면 apiClient 호출로 바꾼다
export const logout = async (): Promise<void> => {
  await delay(300);
};
