// API layer type

// 이름 입력 회원가입 (POST /api/members/signup)
// 카카오 이름에 한글이 없어 자동 가입되지 않은 신규 회원이 /signup에서 이름을 입력해 가입을 마친다
export interface SignupRequest {
  name: string;
}

export interface SignupResponse {
  memberId: number;
}

/** 가입 실패 코드: 100 가입 대기 정보 없음(세션 만료 등), 101 이름 규칙 위반, 102 이미 가입한 카카오 계정 */
export type SignupErrorCode = '100' | '101' | '102';
