// API layer type
// API 스펙 확정 전 화면설계서 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

export type UserId = number;

// 내 정보 조회
export interface User {
  userId: UserId;
  name: string;
}

// 이름 수정
export interface UpdateMyNameRequest {
  name: string;
}
