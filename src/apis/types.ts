/**
 * 서버 공통 응답 형식 (백엔드 Result). 성공·실패 모두 이 모양으로 온다
 * - 성공: code "000", data에 결과
 * - 실패: code에 에러 코드 ("003" 로그인 안 함, "101" 이름 규칙 위반 등), data는 보통 null
 *   입력값 오류(002)는 data에 [{ field, reason }]
 * 비즈니스 실패(이름 규칙 위반 등)도 HTTP 200으로 오므로, HTTP 상태가 아니라 code로 성공을 판단한다
 */
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

/** 실패 응답 본문. 모양은 성공과 같고 data만 정해져 있지 않다 */
export type ApiError = ApiResponse<unknown>;

export const API_SUCCESS_CODE = '000';
