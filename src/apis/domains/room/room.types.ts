// API layer type
// 서버(Swagger)는 리그를 league로 부르고, 화면 코드는 room으로 부른다
// - 아래 "서버 요청·응답" 타입은 Swagger 그대로 (필드 이름도 서버 그대로)
// - 그 밖의 타입은 화면에서 쓰는 모양. room.mapper가 서버 응답을 이 모양으로 바꾼다
//   (아직 API로 옮기지 않은 대기실·리그 상세 등은 화면설계서 기준 그대로)

import type { ListStockRequest, StockId } from '@/apis/domains/stock/stock.types';
import type { UserId } from '@/apis/domains/user/user.types';

export type RoomId = number;

/** 화면에서 문구를 나눠 보여주는 서버 에러 코드 (백엔드 ErrorCode) */
export const ROOM_ERROR_CODE = {
  /** 없는 초대 코드 (형식 오류, 삭제·만료·종료로 폐기된 코드 포함) */
  INVALID_INVITE_CODE: '201',
  /** 이미 입장한 리그 */
  ALREADY_JOINED: '202',
  /** 리그 인원(참여자 + 대기자) 10명 */
  ROOM_FULL: '203',
  /** 없는 리그, 만료·삭제된 대기실 */
  ROOM_NOT_FOUND: '204',
  /** 이미 리그 5개(대기실 + 진행 중)에 참여 중 */
  ACTIVE_ROOM_LIMIT_EXCEEDED: '205',
  /** 리그 시작: 참여자 3명 미만이거나 대기자가 있음 (둘을 나눠 주지 않는다) */
  CANNOT_START: '206',
  /** 이미 시작·종료된 리그 (초대 코드 확인·입장, 대기실 관리) */
  ALREADY_STARTED: '208',
} as const;

export type RoomErrorCode = (typeof ROOM_ERROR_CODE)[keyof typeof ROOM_ERROR_CODE];

// ---- 서버 요청·응답 (Swagger) ----
// 일시는 KST. 시간대 표시가 없을 수 있어 room.mapper에서 +09:00을 붙여 쓴다

/** 저장된 리그 상태 그대로 (STARTED = 진행 중) */
export type LeagueStatus = 'WAITING' | 'STARTED' | 'ENDED';

export interface TradingDayResponse {
  /** 현재 거래일차 (1~7) */
  dayNumber: number;
  totalDays: number;
  /** 현재 거래일이 끝나는 일시 (다음 09:00) */
  dayEndsAt: string;
}

// GET /api/leagues/me
export interface MyLeagueResponse {
  leagueId: RoomId;
  name: string;
  status: LeagueStatus;
  /** 입장 인원 (참여자 + 대기자) */
  playerCount: number;
  /** 참여자(상장 완료) 수 */
  participantCount: number;
  /** 내가 방장인지 */
  host: boolean;
  /** 내 상장 완료 여부 (false면 대기자) */
  listed: boolean;
  joinedAt: string;
  createdAt: string;
  /** 대기실 만료 일시. 대기실이 아니면 null */
  waitingRoomExpiresAt: string | null;
  /** 시작 전이면 null */
  startedAt: string | null;
  endsAt: string | null;
  /** 진행 중인 리그의 현재 거래일. 그 외 null */
  tradingDay: TradingDayResponse | null;
}

// POST /api/leagues
export interface CreateLeagueRequest {
  leagueName: string;
  stockName: string;
  stockDescription: string;
}

export interface CreateLeagueResponse {
  leagueId: RoomId;
  inviteCode: string;
}

// GET /api/leagues/invite-codes/{inviteCode}
export interface LeagueInfoResponse {
  leagueId: RoomId;
  name: string;
  status: LeagueStatus;
  /** 입장한 사용자 수 (참여자 + 대기자, 최대 10) */
  playerCount: number;
  /** 참여자(상장 완료) 수 */
  participantCount: number;
}

// POST /api/leagues/join
export interface JoinLeagueResponse {
  leagueId: RoomId;
}

// ---- 화면에서 쓰는 모양 ----

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
  /** 대기실 만료 시각. 메인 대기실 카드의 "만료 예정" 표시용 */
  expiresAt: string;
}

export interface EndedRoom {
  roomId: RoomId;
  name: string;
  participantCount: number;
  /** 종료 시각 (ISO 8601, UTC) */
  endedAt: string;
  /**
   * 내 최종 순위. 없으면 카드에 순위 배지를 숨긴다
   * TODO(백엔드 요청): 내 리그 목록(GET /api/leagues/me)에 종료된 리그의 내 순위가 아직 없다
   */
  rank: number | null;
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

// 대기실 입장 (POST /api/leagues/join 요청과 같은 모양)
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
