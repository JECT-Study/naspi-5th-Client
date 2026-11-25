import { apiClient, unwrap } from '@/apis/client';
import type { ApiResponse } from '@/apis/types';
import { toCreateLeagueRequest, toInvitePreview, toMyRooms } from './room.mapper';
import type {
  CreateLeagueResponse,
  CreateRoomRequest,
  CreateRoomResponse,
  InvitePreview,
  JoinLeagueResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  LeagueDetailResponse,
  LeagueInfoResponse,
  LeaveLeagueResponse,
  LeaveRoomResponse,
  MyLeagueResponse,
  MyRoomsResponse,
  PlayerId,
  RoomId,
  UpdateRoomNameRequest,
} from './room.types';

// 리그(서버 league) API. 개발 중 화면 확인은 ?msw=logged-in (msw/handlers가 서버와 같은 모양으로 응답)
// 공통 실패 코드: 004 리그에 입장하지 않은 회원, 204 없는 리그·만료·삭제된 대기실,
// 207 방장이 아님, 208 이미 시작된 리그 (그 밖의 코드는 함수마다 적는다)

/** 내 리그 목록. 서버는 한 목록으로 주고, 진행 중·대기실·종료로 나눠 돌려준다 */
export const getMyRooms = (): Promise<MyRoomsResponse> =>
  apiClient.get<ApiResponse<MyLeagueResponse[]>>('/api/leagues/me').then(unwrap).then(toMyRooms);

/** 리그 상세 (대기실 참여자·초대 코드, 리그 화면 이름·일차). 화면 모양은 room.queries의 select로 바꾼다 */
export const getLeagueDetail = (roomId: RoomId): Promise<LeagueDetailResponse> =>
  apiClient.get<ApiResponse<LeagueDetailResponse>>(`/api/leagues/${roomId}/detail`).then(unwrap);

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

/** 리그 이름 수정 (방장, 대기실). 실패 코드: 200 이름 규칙 위반 */
export const updateRoomName = async (
  roomId: RoomId,
  request: UpdateRoomNameRequest,
): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/name`, request);
};

/** 대기실 삭제 (방장) */
export const deleteRoom = async (roomId: RoomId): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/delete`);
};

/** 대기실 나가기. 방장이 나갔는데 넘겨받을 참여자(상장 완료)가 없으면 대기실이 사라진다 */
export const leaveRoom = (roomId: RoomId): Promise<LeaveRoomResponse> =>
  apiClient
    .post<ApiResponse<LeaveLeagueResponse>>(`/api/leagues/${roomId}/leave`)
    .then(unwrap)
    .then(({ waitingRoomDeleted }) => ({ isRoomDeleted: waitingRoomDeleted }));

/** 플레이어 내보내기 (방장, 대기실). 실패 코드: 209 방장 자신, 210 이미 나갔거나 내보낸 플레이어 */
export const kickMember = async (roomId: RoomId, playerId: PlayerId): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/players/${playerId}/kick`);
};

/** 리그 시작 (방장). 실패 코드: 206 참여자 3명 미만이거나 대기자가 있음 */
export const startRoom = async (roomId: RoomId): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/start`);
};
