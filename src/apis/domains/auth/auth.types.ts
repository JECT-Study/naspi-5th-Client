// API layer type
// API 스펙 확정 전 화면설계서·서비스 정책 1.1 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

// 카카오 로그인
export interface LoginResponse {
  /** 카카오 이름에 한글이 없어 회원가입 단계에서 이름을 받아야 하는지 (서비스 정책 1.2) */
  isNameRequired: boolean;
}
