// 로그인 후 돌아갈 화면
// 카카오 로그인은 페이지 이동이라 앱 상태가 사라지고, 백엔드는 로그인이 끝나면 항상 / 로 보낸다
// 그래서 로그인을 시작할 때 돌아갈 주소를 sessionStorage에 저장해 두고, / 로 돌아온 뒤 그 주소로 보낸다
// sessionStorage는 같은 탭 안에서만 남는다. 카카오 로그인은 같은 탭에서 오가므로 충분하다

/**
 * 랜딩(/)으로 보낼 때 함께 넘기는 navigate state
 * - 로그인 가드(AuthLayout): 들어오려던 주소 → '친구들과 시작하기'로 로그인해도 그리로 간다
 * - 세션 만료(AppLayout): 보던 주소 + 재로그인 모달 표시 → 재로그인 모달로 로그인했을 때만 그리로 간다
 */
export interface LandingState {
  returnPath?: string;
  isSessionExpired?: boolean;
}

const STORAGE_KEY = 'naspi:loginReturnPath';
// 로그인 흐름 자체의 화면은 돌아갈 곳이 아니다
const NON_RETURNABLE_PATHS = ['/', '/signup', '/login-failure'];

// 우리 앱 안의 주소만 받는다. '//other.com'처럼 다른 사이트로 가는 주소는 막는다
const isReturnablePath = (path: string): boolean =>
  path.startsWith('/') &&
  !path.startsWith('//') &&
  !NON_RETURNABLE_PATHS.includes(path.split(/[?#]/)[0]);

// 사생활 보호 모드 등에서 sessionStorage가 막혀 있으면 저장 없이 넘어간다 (메인으로 가게 된다)

/** 로그인 시작 전에 돌아갈 주소를 저장한다. 없거나 돌아갈 수 없는 주소면 예전 값을 지운다 */
export const saveLoginReturnPath = (path?: string) => {
  try {
    if (path && isReturnablePath(path)) sessionStorage.setItem(STORAGE_KEY, path);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장하지 못해도 로그인은 계속한다
  }
};

/** 저장된 돌아갈 주소. 지우지 않는다 (화면이 두 번 그려져도 같은 값을 읽게) */
export const readLoginReturnPath = (): string | null => {
  try {
    const path = sessionStorage.getItem(STORAGE_KEY);
    return path && isReturnablePath(path) ? path : null;
  } catch {
    return null;
  }
};

/** 돌아간 뒤 지운다. 다음 로그인 때 예전 주소로 가지 않게 */
export const clearLoginReturnPath = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 지우지 못해도 다음 로그인 시작 때 덮어쓴다
  }
};
