// API layer type

export type UserId = number;

// 내 이름 조회·수정 응답 (GET·POST /api/members/me/name)
// 내 정보 API는 이름만 준다. 회원 ID가 필요해지면(리그 API 연동 때) 백엔드에 요청한다
export interface MyName {
  name: string;
}

// 이름 수정
export interface UpdateMyNameRequest {
  name: string;
}
