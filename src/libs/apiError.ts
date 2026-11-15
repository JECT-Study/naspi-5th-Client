import axios from 'axios';

// 서버 에러 응답에서 에러 코드만 읽는다 (응답 형식: apis/types의 ApiResponse { code, message, data })
// queryClient(libs)와 화면이 같이 쓰므로 libs에 둔다 (libs는 apis를 import하지 않음)
interface ErrorResponseBody {
  code?: string;
}

/** 서버가 보낸 에러 코드 ("101" 등). 서버 응답이 없거나(네트워크·타임아웃) 형식이 다르면 undefined */
export const getApiErrorCode = (error: unknown): string | undefined =>
  axios.isAxiosError<ErrorResponseBody>(error) ? error.response?.data?.code : undefined;

/** 로그인이 끝났다고 보는 에러 코드: 003 로그인 안 함(세션 만료), 103 회원 정보 없음(탈퇴 등) */
const SESSION_ENDED_CODES = ['003', '103'];

/** 로그인이 안 돼 있거나 끝난 응답인지 (API 문서: "카카오 로그인부터 다시") */
export const isSessionEndedError = (error: unknown): boolean =>
  axios.isAxiosError(error) &&
  (error.response?.status === 401 || SESSION_ENDED_CODES.includes(getApiErrorCode(error) ?? ''));
