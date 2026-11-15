import axios, { AxiosError, type AxiosResponse } from 'axios';
import { isSessionEndedError } from '@/libs/apiError';
import { reportSessionExpired } from '@/libs/session';
import { API_SUCCESS_CODE, type ApiError, type ApiResponse } from './types';

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * true면 로그인이 끝난 응답이어도 재로그인 모달(공통 2-2)을 띄우지 않는다
     * 로그인 여부를 확인하는 요청에 쓴다. 로그인을 안 한 건 만료가 아니므로 화면이 직접 랜딩으로 보낸다
     */
    skipSessionExpiredModal?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  // 로그인은 api 서버의 세션 쿠키(SESSION)로 유지된다. 다른 주소(dev.api.naspi.my)로 보내는 요청에도 쿠키를 붙인다
  withCredentials: true,
});

const isApiResponse = (body: unknown): body is ApiResponse<unknown> =>
  typeof body === 'object' && body !== null && typeof (body as ApiError).code === 'string';

// 로그인 세션이 끝났으면(401, code 003·103) 지금 화면 위에 재로그인 모달을 띄운다 (화면설계서 공통 2-2)
const rejectWithSessionCheck = (error: AxiosError) => {
  if (isSessionEndedError(error) && !error.config?.skipSessionExpiredModal) reportSessionExpired();
  return Promise.reject(error);
};

// 에러 알림은 여기서 띄우지 않는다. 조회·변경 실패 알림은 libs/queryClient의 QueryCache·MutationCache가 맡는다
apiClient.interceptors.response.use((response) => {
  // HTTP 200이어도 code가 "000"이 아니면 실패다 (이름 규칙 위반 등). 에러로 바꿔서 화면의 onError로 보낸다
  // 원래 응답을 그대로 담아 두므로 화면은 getApiErrorCode(libs/apiError)로 code를 읽는다
  const body: unknown = response.data;
  if (isApiResponse(body) && body.code !== API_SUCCESS_CODE) {
    return rejectWithSessionCheck(
      new AxiosError(
        body.message,
        AxiosError.ERR_BAD_RESPONSE,
        response.config,
        response.request,
        response,
      ),
    );
  }
  return response;
}, rejectWithSessionCheck);

/** 공통 응답에서 data만 꺼낸다. 서비스 함수가 `apiClient.get(...).then(unwrap)`처럼 쓴다 */
export const unwrap = <T>(response: AxiosResponse<ApiResponse<T>>): T => response.data.data;
