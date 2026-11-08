import type { LoginResponse } from '@/apis/domains/auth/auth.types';
import { createMockApiError } from './mockError';

// 로그인 결과는 주소로 바꿔 볼 수 있다
//   /?mockLogin=fail  로그인 실패 안내
//   /?mockLogin=new   이름 입력 모달 (카카오 이름에 한글이 없는 신규 회원)
export const mockAuthServer = {
  login: (): LoginResponse => {
    const mode = new URLSearchParams(window.location.search).get('mockLogin');
    if (mode === 'fail') throw createMockApiError('KAKAO_LOGIN_FAILED');
    return { isNameRequired: mode === 'new' };
  },
};
