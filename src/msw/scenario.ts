// MSW 시나리오: 주소에 ?msw=이름 을 붙여 열었을 때만 켠다. 기본은 꺼짐(실제 서버로 요청)
// 앱 안에서 화면을 옮기는 동안은 켜진 채로 있고, 새로고침하거나 주소로 다시 열면 그때 주소에 ?msw가 없으면 꺼진다
// (예전에는 탭마다 시나리오를 기억해서, 새로고침해도 테스트 시나리오가 남아 헷갈렸다)
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

const isScenario = (value: string | null): value is MswScenario =>
  MSW_SCENARIOS.includes(value as MswScenario);

/** 주소의 ?msw= 시나리오. 없거나 모르는 이름이면 null (MSW를 켜지 않는다) */
export const resolveScenario = (): MswScenario | null => {
  const fromUrl = new URLSearchParams(window.location.search).get('msw');
  return isScenario(fromUrl) ? fromUrl : null;
};
