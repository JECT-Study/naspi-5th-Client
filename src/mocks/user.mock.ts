import type { UserId } from '@/apis/domains/user/user.types';

// 나 = 리그 참여자 김진영 (members.mock의 userId 1)
// 리그 목업이 "나"를 구분하는 데 쓴다. 실제 내 이름은 GET /api/members/me/name으로 받는다
export const meMock: { userId: UserId; name: string } = { userId: 1, name: '김진영' };
