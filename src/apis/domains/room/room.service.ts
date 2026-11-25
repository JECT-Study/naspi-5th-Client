import { apiClient, unwrap } from '@/apis/client';
import type { ApiResponse } from '@/apis/types';
import type { UserId } from '@/apis/domains/user/user.types';
import { delay } from '@/mocks/delay';
import { mockRoomServer } from '@/mocks/room.mock';
import { toCreateLeagueRequest, toInvitePreview, toMyRooms } from './room.mapper';
import type {
  CreateLeagueResponse,
  CreateRoomRequest,
  CreateRoomResponse,
  InvitePreview,
  JoinLeagueResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  LeagueInfoResponse,
  MyLeagueResponse,
  MyRoomsResponse,
  RoomDetail,
  RoomId,
  UpdateRoomNameRequest,
  WaitingRoomDetail,
} from './room.types';

// 실제 API: 내 리그 목록, 리그 생성, 초대 코드 조회, 입장 (개발 중 화면 확인은 ?msw=logged-in, msw/handlers)
// TODO: 나머지도 API로 옮긴다. 아래 mock은 실제 요청처럼 0.3초 뒤에 응답하고, 서버 에러는 같은 모양(AxiosError)으로 던진다

/** 내 리그 목록. 서버는 한 목록으로 주고, 진행 중·대기실·종료로 나눠 돌려준다 */
export const getMyRooms = (): Promise<MyRoomsResponse> =>
  apiClient.get<ApiResponse<MyLeagueResponse[]>>('/api/leagues/me').then(unwrap).then(toMyRooms);

export const getRoom = async (roomId: RoomId): Promise<RoomDetail> => {
  await delay(300);
  return mockRoomServer.getRoom(roomId);
};

export const getWaitingRoom = async (roomId: RoomId): Promise<WaitingRoomDetail> => {
  await delay(300);
  return mockRoomServer.getWaitingRoom(roomId);
};

/**
 * 리그 생성 (방장 종목 상장까지 한 번에). 실패 코드: 205 리그 5개 참여 중,
 * 200 리그 이름·300 종목 이름·301 종목 소개 규칙 위반 (화면에서 미리 막으므로 공통 토스트)
 */
export const createRoom = (request: CreateRoomRequest): Promise<CreateRoomResponse> =>
  apiClient
    .post<ApiResponse<CreateLeagueResponse>>('/api/leagues', toCreateLeagueRequest(request))
    .then(unwrap)
    .then(({ leagueId }) => ({ roomId: leagueId }));

/** 초대 코드로 리그 정보 조회 (입장 전 확인). 실패 코드: 201 없는 코드(폐기된 코드 포함), 208 이미 시작·종료된 리그 */
export const getInvitePreview = (inviteCode: string): Promise<InvitePreview> =>
  apiClient
    .get<ApiResponse<LeagueInfoResponse>>(
      `/api/leagues/invite-codes/${encodeURIComponent(inviteCode)}`,
    )
    .then(unwrap)
    .then(toInvitePreview);

/**
 * 초대 코드로 대기실 입장. 실패 코드: 201 없는 코드(폐기된 코드 포함), 208 이미 시작·종료된 리그,
 * 202 이미 입장한 리그, 203 인원 10명, 205 리그 5개 참여 중
 */
export const joinRoom = (request: JoinRoomRequest): Promise<JoinRoomResponse> =>
  apiClient
    .post<ApiResponse<JoinLeagueResponse>>('/api/leagues/join', request)
    .then(unwrap)
    .then(({ leagueId }) => ({ roomId: leagueId }));

export const updateRoomName = async (
  roomId: RoomId,
  request: UpdateRoomNameRequest,
): Promise<void> => {
  await delay(300);
  mockRoomServer.updateRoomName(roomId, request);
};

export const deleteRoom = async (roomId: RoomId): Promise<void> => {
  await delay(300);
  mockRoomServer.deleteRoom(roomId);
};

export const leaveRoom = async (roomId: RoomId): Promise<void> => {
  await delay(300);
  mockRoomServer.leaveRoom(roomId);
};

export const kickMember = async (roomId: RoomId, userId: UserId): Promise<void> => {
  await delay(300);
  mockRoomServer.kickMember(roomId, userId);
};

export const startRoom = async (roomId: RoomId): Promise<void> => {
  await delay(600);
  mockRoomServer.startRoom(roomId);
};
