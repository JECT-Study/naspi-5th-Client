import { createMockApiError } from './mockError';

// 개발용 실패 스위치: 주소에 ?mock=error 를 붙여 열면 mock 응답이 모두 서버 오류(500)로 실패한다
// 조회 실패 화면(마스코트 + 다시 시도)을 확인할 때 쓴다. MSW처럼 새로고침하면 그때 주소를 다시 읽는다
// 배포 빌드에서는 켜지지 않는다
const mockSwitch = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('mock')
  : null;
const shouldFailAll = mockSwitch === 'error';

// 빈 화면 스위치: ?mock=empty 로 열면 내가 속한 리그·대기실이 하나도 없는 상태로 시작한다 (메인 빈 화면 확인용)
export const startsWithNoRooms = mockSwitch === 'empty';

// 빈 피드 스위치: ?mock=no-feed 로 열면 리그 피드·종목 정보의 공시/뉴스 목록이 빈 상태로 나온다 (리그는 그대로)
export const startsWithNoFeed = mockSwitch === 'no-feed';

// mock 응답에 네트워크 지연을 흉내 낸다 (로딩 화면 확인용). 실패 스위치가 켜져 있으면 지연 뒤 서버 오류를 던진다
export const delay = async (ms: number) => {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
  if (shouldFailAll) throw createMockApiError('999', '서버 내부 오류가 발생했습니다.', 500);
};
