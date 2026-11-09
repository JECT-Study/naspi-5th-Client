// API layer type
// API 스펙 확정 전 화면설계서 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

import type { ListStockRequest, StockId } from '@/apis/domains/stock/stock.types';
import type { UserId } from '@/apis/domains/user/user.types';

export type RoomId = number;

/** 화면에서 문구를 나눠 보여주는 서버 에러 코드. TODO: BE와 코드 이름 맞추기 */
export type RoomErrorCode =
  | 'INVALID_INVITE_CODE'
  | 'ROOM_FULL'
  | 'ROOM_ALREADY_STARTED'
  | 'ROOM_DELETED'
  | 'ACTIVE_ROOM_LIMIT_EXCEEDED'
  | 'WAITING_MEMBER_EXISTS'
  | 'NOT_ENOUGH_MEMBERS';

// 내 리그 목록 조회
export interface OngoingRoom {
  roomId: RoomId;
  name: string;
  participantCount: number;
  /** 리그 시작 시각 (ISO 8601, UTC) */
  startedAt: string;
  /** 종료 예정 시각 (ISO 8601, UTC) */
  endAt: string;
}

export interface WaitingRoom {
  roomId: RoomId;
  name: string;
  /** 상장을 마친 참여자 수 */
  listedCount: number;
  /** 내가 상장을 마쳤는지 */
  isListed: boolean;
  /** 대기실 생성 시각 (ISO 8601, UTC) */
  createdAt: string;
  /** 대기실 만료 시각. 메인 대기실 카드의 "만료 예정" 표시용. TODO(API): 요청 필드 */
  expiresAt: string;
}

export interface EndedRoom {
  roomId: RoomId;
  name: string;
  participantCount: number;
  /** 종료 시각 (ISO 8601, UTC) */
  endedAt: string;
  /** 내 최종 순위 */
  rank: number;
}

export interface MyRoomsResponse {
  ongoing: OngoingRoom[];
  waiting: WaitingRoom[];
  ended: EndedRoom[];
}

// 리그 상세 조회
export type RoomStatus = 'WAITING' | 'ONGOING' | 'ENDED';

export interface RoomDetail {
  roomId: RoomId;
  name: string;
  status: RoomStatus;
  /** 리그 일차 (1일차부터). 대기실이면 0 */
  day: number;
  /** 종료(예정) 시각. 대기실이면 null */
  endAt: string | null;
}

// 새 리그 만들기 (방장의 종목 상장과 함께 대기실 생성)
export interface CreateRoomRequest {
  name: string;
  stock: ListStockRequest;
}

export interface CreateRoomResponse {
  roomId: RoomId;
}

// 초대 코드로 대기실 미리보기
export interface InvitePreview {
  roomId: RoomId;
  name: string;
  /** 상장을 완료한 참여자 수 */
  listedCount: number;
}

// 대기실 입장
export interface JoinRoomRequest {
  inviteCode: string;
}

export interface JoinRoomResponse {
  roomId: RoomId;
}

// 대기실 조회
export interface ListedStock {
  stockId: StockId;
  name: string;
  description: string;
  /** 상장 완료 시각. 종목 정렬 기준 */
  listedAt: string;
}

export interface WaitingMember {
  userId: UserId;
  name: string;
  isMe: boolean;
  /** 방장인지 */
  isHost: boolean;
  /** 상장한 종목. 아직 상장하지 않은 대기자면 null */
  stock: ListedStock | null;
}

export interface WaitingRoomDetail {
  roomId: RoomId;
  name: string;
  inviteCode: string;
  /** 대기실 만료 시각 (생성 + 7일) */
  expiresAt: string;
  members: WaitingMember[];
}

// 리그 이름 수정
export interface UpdateRoomNameRequest {
  name: string;
}
