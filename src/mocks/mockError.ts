import { AxiosError, type AxiosResponse } from 'axios';
import type { ApiError } from '@/apis/types';

// 서버 에러 응답과 같은 모양의 에러. 화면은 getApiErrorCode로 code를 읽는다
export const createMockApiError = (code: string, message = code, status = 400) => {
  const data: ApiError = { success: false, error: { code, message } };
  return new AxiosError(message, AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {},
    data,
  } as AxiosResponse<ApiError>);
};
