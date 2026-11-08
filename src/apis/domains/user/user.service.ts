import { delay } from '@/mocks/delay';
import { meMock } from '@/mocks/user.mock';
import type { UpdateMyNameRequest, User } from './user.types';

// TODO: API가 준비되면 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)
export const getMe = async (): Promise<User> => {
  await delay(300);
  return { ...meMock };
};

// TODO: API가 준비되면 apiClient 호출로 바꾼다
export const updateMyName = async (request: UpdateMyNameRequest): Promise<User> => {
  await delay(300);
  // 다시 조회해도 바뀐 이름이 나오도록 mock 원본을 고친다
  meMock.name = request.name;
  return { ...meMock };
};

// TODO: API가 준비되면 apiClient 호출로 바꾼다
export const withdraw = async (): Promise<void> => {
  await delay(300);
};
