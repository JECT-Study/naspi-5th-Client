// MSW 시나리오: 주소에 ?msw=이름 을 붙여 고른다. 같은 탭에서는 페이지를 옮겨도 유지된다 (sessionStorage)
// ?msw=off 로 끈다. 시나리오가 없으면 MSW를 켜지 않고 실제 서버로 요청한다
//
//   logged-out    로그인 안 함 (내 이름 조회 401)
//   logged-in     로그인됨 (내 이름 조회 200, 이름 김진영)
//   signup        가입 대기 상태 → 이름 입력 가입 성공 (가입하면 로그인됨)
//   signup-101    이름 입력 가입: 이름 규칙 위반
//   signup-100    이름 입력 가입: 가입 대기 정보 없음 (카카오 로그인 후 10분이 지남 등)
//   signup-102    이름 입력 가입: 이미 가입한 카카오 계정
//   signup-error  이름 입력 가입: 서버 오류 (500)
//
//   아래는 로그인된 상태에서 시작한다 (드로어 '내 계정'). 이름 수정·로그아웃·탈퇴는 logged-in이면 성공한다
//   name-101         이름 수정: 이름 규칙 위반
//   name-error       이름 수정: 서버 오류 (500)
//   logout-error     로그아웃: 서버 오류 (500)
//   withdraw-error   회원 탈퇴: 서버 오류 (500)
//   session-expired  이름 수정·탈퇴를 하면 세션 만료 (401) → 랜딩 + 재로그인 모달
//                    (로그아웃은 실제 서버처럼 세션이 없어도 성공한다)
//   me-error         첫 로그인 확인(내 이름 조회)만 서버 오류 (500), 그다음부터 로그인됨
//                    앱 화면·랜딩 모두 [공통 오류] 페이지 → '메인 페이지로 이동'하면 메인

export const MSW_SCENARIOS = [
  'logged-out',
  'logged-in',
  'signup',
  'signup-101',
  'signup-100',
  'signup-102',
  'signup-error',
  'name-101',
  'name-error',
  'logout-error',
  'withdraw-error',
  'session-expired',
  'me-error',
] as const;

export type MswScenario = (typeof MSW_SCENARIOS)[number];

const STORAGE_KEY = 'naspi:msw';

const isScenario = (value: string | null): value is MswScenario =>
  MSW_SCENARIOS.includes(value as MswScenario);

/** 주소의 ?msw= 를 읽어 저장하고, 지금 시나리오를 돌려준다. 없으면 null (MSW를 켜지 않는다) */
export const resolveScenario = (): MswScenario | null => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('msw');
    if (fromUrl === 'off') sessionStorage.removeItem(STORAGE_KEY);
    else if (isScenario(fromUrl)) sessionStorage.setItem(STORAGE_KEY, fromUrl);
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return isScenario(saved) ? saved : null;
  } catch {
    return null;
  }
};
