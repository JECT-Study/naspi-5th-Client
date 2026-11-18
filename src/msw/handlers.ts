import { http, HttpResponse } from 'msw';
import type { SignupRequest } from '@/apis/domains/auth/auth.types';
import type { UpdateMyNameRequest } from '@/apis/domains/user/user.types';
import type { ApiResponse } from '@/apis/types';
import type { MswScenario } from './scenario';

// 실제 API와 같은 응답을 만든다 (백엔드 Result: { code, message, data }, 비즈니스 실패도 HTTP 200)
// 한 핸들러가 성공·실패를 모두 돌려주므로 응답 타입을 하나(ApiResponse<unknown>)로 맞춘다
type MockResponse = HttpResponse<ApiResponse<unknown>>;
const success = (data: unknown = null): MockResponse =>
  HttpResponse.json<ApiResponse<unknown>>({ code: '000', message: '', data });
const failure = (code: string, message: string, status = 200): MockResponse =>
  HttpResponse.json<ApiResponse<unknown>>({ code, message, data: null }, { status });

// 백엔드 ErrorCode 문구 그대로
const unauthorized = () => failure('003', '인증이 필요합니다.', 401);
const serverError = () => failure('999', '서버 내부 오류가 발생했습니다.', 500);
const invalidName = () => failure('101', '이름은 1~5자의 한글만 사용할 수 있습니다.');

// 가입 실패 시나리오 → 서버 응답
const SIGNUP_FAILURES: Partial<Record<MswScenario, () => MockResponse>> = {
  'signup-101': invalidName,
  'signup-100': () => failure('100', '카카오 로그인 후 가입할 수 있습니다.'),
  'signup-102': () => failure('102', '이미 가입한 회원입니다.'),
  'signup-error': serverError,
};

// 로그인 안 한 상태에서 시작하는 시나리오 (나머지는 로그인된 상태에서 시작한다)
const LOGGED_OUT_SCENARIOS: MswScenario[] = [
  'logged-out',
  'signup',
  'signup-101',
  'signup-100',
  'signup-102',
  'signup-error',
];

/**
 * 시나리오별 핸들러. 로그인 상태는 메모리에 두고 실제 서버처럼 바꾼다
 * (가입 → 로그인됨, 로그아웃·탈퇴 → 로그인 안 함, session-expired에서 요청하면 → 로그인 안 함)
 * 새로고침하면 시나리오의 처음 상태로 돌아간다
 */
export const createHandlers = (scenario: MswScenario) => {
  const me = { isLoggedIn: !LOGGED_OUT_SCENARIOS.includes(scenario), name: '김진영' };
  // me-error: 첫 로그인 확인만 실패시켜서 '메인 페이지로 이동'으로 회복되는 것까지 볼 수 있게 한다
  let shouldFailMe = scenario === 'me-error';

  // 로그인이 필요한 요청: 로그인 안 했으면 401. session-expired면 이번 요청에서 세션이 끝난다
  const requireLogin = (handle: () => MockResponse | Promise<MockResponse>) => {
    if (scenario === 'session-expired') me.isLoggedIn = false;
    return me.isLoggedIn ? handle() : unauthorized();
  };

  return [
    http.get('*/api/members/me/name', () => {
      if (shouldFailMe) {
        shouldFailMe = false;
        return serverError();
      }
      return me.isLoggedIn ? success({ name: me.name }) : unauthorized();
    }),

    http.post('*/api/members/signup', async ({ request }) => {
      const failed = SIGNUP_FAILURES[scenario];
      if (failed) return failed();
      if (scenario !== 'signup') return failure('100', '카카오 로그인 후 가입할 수 있습니다.');
      const { name } = (await request.json()) as SignupRequest;
      me.isLoggedIn = true;
      me.name = name;
      return success({ memberId: 7 });
    }),

    http.post('*/api/members/me/name', ({ request }) =>
      requireLogin(async () => {
        if (scenario === 'name-101') return invalidName();
        if (scenario === 'name-error') return serverError();
        const { name } = (await request.json()) as UpdateMyNameRequest;
        me.name = name;
        return success({ name });
      }),
    ),

    // 실제 서버는 로그인 안 한 상태여도 로그아웃을 성공으로 응답한다
    http.post('*/api/auth/logout', () => {
      if (scenario === 'logout-error') return serverError();
      me.isLoggedIn = false;
      return success();
    }),

    http.post('*/api/members/me/withdraw', () =>
      requireLogin(() => {
        if (scenario === 'withdraw-error') return serverError();
        me.isLoggedIn = false;
        return success();
      }),
    ),
  ];
};
