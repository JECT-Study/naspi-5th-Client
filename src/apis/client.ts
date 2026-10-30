import axios, { type AxiosError } from 'axios';
import { notify } from '@/libs/notify';
import type { ApiError } from './types';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** true면 공통 에러 알림을 띄우지 않는다. 에러를 화면에서 직접 보여줄 때 사용 */
    skipErrorNotify?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
});

// 서버 에러 코드 → 사용자에게 보여줄 메시지
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PARAMETERS: '잘못된 요청입니다.',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다.',
};

const getErrorMessage = (error: AxiosError<ApiError>): string => {
  if (!error.response) return '네트워크 연결을 확인해주세요.';

  const apiError = error.response.data?.error;
  if (!apiError) return '오류가 발생했습니다.';

  return ERROR_MESSAGES[apiError.code] ?? apiError.message ?? '알 수 없는 오류가 발생했습니다.';
};

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/') window.location.replace('/');
      return Promise.reject(error);
    }

    if (!error.config?.skipErrorNotify) {
      notify.error(getErrorMessage(error));
    }

    return Promise.reject(error);
  },
);
