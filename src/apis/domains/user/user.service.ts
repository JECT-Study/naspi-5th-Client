import { apiClient, unwrap } from '@/apis/client';
import type { ApiResponse } from '@/apis/types';
import { delay } from '@/mocks/delay';
import { meMock } from '@/mocks/user.mock';
import type { MyName, UpdateMyNameRequest } from './user.types';

/**
 * 내 이름 조회. 로그인 여부 확인에도 쓴다 (로그인 안 했으면 401·003, 탈퇴했으면 103으로 실패)
 * 로그인 안 한 건 세션 만료가 아니므로 재로그인 모달을 띄우지 않고, 부르는 화면이 랜딩으로 보낸다
 */
export const getMe = (): Promise<MyName> =>
  apiClient
    .get<ApiResponse<MyName>>('/api/members/me/name', { skipSessionExpiredModal: true })
    .then(unwrap);

// TODO: API가 준비되면 apiClient 호출로 바꾼다
export const updateMyName = async (request: UpdateMyNameRequest): Promise<MyName> => {
  await delay(300);
  // 다시 조회해도 바뀐 이름이 나오도록 mock 원본을 고친다
  meMock.name = request.name;
  return { name: meMock.name };
};

// TODO: API가 준비되면 apiClient 호출로 바꾼다
export const withdraw = async (): Promise<void> => {
  await delay(300);
};
