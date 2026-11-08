import axios, { type AxiosError } from 'axios';
import { reportSessionExpired } from '@/libs/session';
import type { ApiError } from './types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
});

// 에러 알림은 여기서 띄우지 않는다. 조회·변경 실패 알림은 libs/queryClient의 QueryCache·MutationCache가 맡는다
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // 로그인 세션 만료: 지금 화면 위에 재로그인 모달을 띄운다 (화면설계서 공통 2-2)
    if (error.response?.status === 401) reportSessionExpired();
    return Promise.reject(error);
  },
);
