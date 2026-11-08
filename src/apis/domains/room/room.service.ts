import type { UserId } from '@/apis/domains/user/user.types';
import { delay } from '@/mocks/delay';
import { mockRoomServer } from '@/mocks/room.mock';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  InvitePreview,
  JoinRoomRequest,
  JoinRoomResponse,
  MyRoomsResponse,
  RoomDetail,
  RoomId,
  UpdateRoomNameRequest,
  WaitingRoomDetail,
} from './room.types';

// TODO: API가 준비되면 각 함수 안쪽을 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)
// mock은 실제 요청처럼 0.3초 뒤에 응답하고, 서버 에러는 같은 모양(AxiosError)으로 던진다

export const getMyRooms = async (): Promise<MyRoomsResponse> => {
  await delay(300);
  return mockRoomServer.getMyRooms();
};

export const getRoom = async (roomId: RoomId): Promise<RoomDetail> => {
  await delay(300);
  return mockRoomServer.getRoom(roomId);
};

export const getWaitingRoom = async (roomId: RoomId): Promise<WaitingRoomDetail> => {
  await delay(300);
  return mockRoomServer.getWaitingRoom(roomId);
};

export const createRoom = async (request: CreateRoomRequest): Promise<CreateRoomResponse> => {
  await delay(600);
  return mockRoomServer.createRoom(request);
};

export const getInvitePreview = async (inviteCode: string): Promise<InvitePreview> => {
  await delay(600);
  return mockRoomServer.getInvitePreview(inviteCode);
};

export const joinRoom = async (request: JoinRoomRequest): Promise<JoinRoomResponse> => {
  await delay(600);
  return mockRoomServer.joinRoom(request);
};

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
