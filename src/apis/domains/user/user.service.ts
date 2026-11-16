import { apiClient, unwrap } from '@/apis/client';
import type { ApiResponse } from '@/apis/types';
import type { MyName, UpdateMyNameRequest } from './user.types';

/**
 * 내 이름 조회. 로그인 여부 확인에도 쓴다 (로그인 안 했으면 401·003, 탈퇴했으면 103으로 실패)
 * 로그인 안 한 건 세션 만료가 아니므로 재로그인 모달을 띄우지 않고, 부르는 화면이 랜딩으로 보낸다
 */
export const getMe = (): Promise<MyName> =>
  apiClient
    .get<ApiResponse<MyName>>('/api/members/me/name', { skipSessionExpiredModal: true })
    .then(unwrap);

/** 내 이름 수정. 실패 코드: 101 이름 규칙 위반 (003·103은 세션 만료로 처리된다) */
export const updateMyName = (request: UpdateMyNameRequest): Promise<MyName> =>
  apiClient.post<ApiResponse<MyName>>('/api/members/me/name', request).then(unwrap);

/** 회원 탈퇴. 바로 처리되고 로그아웃된다 (003·103은 세션 만료로 처리된다) */
export const withdraw = async (): Promise<void> => {
  await apiClient.post('/api/members/me/withdraw');
};
