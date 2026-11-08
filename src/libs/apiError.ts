import axios from 'axios';

// 서버 에러 응답에서 에러 코드만 읽는다 (응답 형식: apis/types의 ApiError)
// queryClient(libs)와 화면이 같이 쓰므로 libs에 둔다 (libs는 apis를 import하지 않음)
interface ErrorResponseBody {
  error?: { code?: string };
}

/** 서버가 보낸 에러 코드. 서버 응답이 없거나(네트워크·타임아웃) 형식이 다르면 undefined */
export const getApiErrorCode = (error: unknown): string | undefined =>
  axios.isAxiosError<ErrorResponseBody>(error) ? error.response?.data?.error?.code : undefined;
