import type {
  CreateRoomRequest,
  CreateRoomResponse,
  InvitePreview,
  JoinRoomRequest,
  JoinRoomResponse,
  ListedStock,
  MyRoomsResponse,
  RoomDetail,
  RoomErrorCode,
  RoomId,
  RoomStatus,
  UpdateRoomNameRequest,
  WaitingRoomDetail,
} from '@/apis/domains/room/room.types';
import type { ListStockRequest, StockErrorCode } from '@/apis/domains/stock/stock.types';
import type { UserId } from '@/apis/domains/user/user.types';
import { findMemberMock, leagueMembersMock } from './members.mock';
import { createMockApiError } from './mockError';
import { meMock } from './user.mock';

// 리그 mock: 리그를 메모리에 두고 내 리그 목록·리그 상세·대기실 응답을 여기서 만든다
// 리그 생성·입장·나가기 같은 변경도 이 상태를 고쳐서, 다시 조회하면 바뀐 결과가 나온다

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_MEMBERS = 10;
const MIN_MEMBERS_TO_START = 3;
const MAX_ACTIVE_ROOMS = 5;
const WAITING_ROOM_LIFETIME_DAYS = 7;
const LEAGUE_DAYS = 7;

// 오늘 기준 n일 뒤 09:00 KST(= 00:00 UTC). 음수면 n일 전
const daysFromToday = (days: number) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(today.getTime() + days * DAY_MS).toISOString();
};

interface MockMember {
  userId: UserId;
  name: string;
  isHost: boolean;
  stock: ListedStock | null;
}

interface MockRoom {
  roomId: RoomId;
  name: string;
  status: RoomStatus;
  inviteCode: string;
  createdAt: string;
  startedAt: string | null;
  endAt: string | null;
  day: number;
  members: MockMember[];
  /** 종료된 리그의 내 순위 */
  myRank?: number;
}

let nextStockId = 100;
const listed = (name: string, description: string, listedAt: string): ListedStock => ({
  stockId: nextStockId++,
  name,
  description,
  listedAt,
});

const ME_ID = meMock.userId;
// 내 이름은 이름 수정을 반영하도록 meMock에서 읽는다
const me = (isHost: boolean, stock: ListedStock | null): MockMember => ({
  userId: ME_ID,
  name: meMock.name,
  isHost,
  stock,
});
const friend = (userId: number, name: string, stock: ListedStock | null): MockMember => ({
  userId,
  name,
  isHost: false,
  stock,
});
const asHost = (member: MockMember): MockMember => ({ ...member, isHost: true });
// 리그 참여자 mock(members.mock)의 친구. listedDaysAgo가 있으면 그날 자기 종목을 상장한 상태
const member = (userId: number, listedDaysAgo: number | null = null): MockMember => {
  const seed = findMemberMock(userId);
  if (!seed) throw new Error(`members.mock에 없는 참여자: ${userId}`);
  return friend(
    userId,
    seed.name,
    listedDaysAgo === null
      ? null
      : listed(seed.stockName, seed.description, daysFromToday(-listedDaysAgo)),
  );
};
// 나를 뺀 리그 참여자 6명
const allFriends = () =>
  leagueMembersMock.filter((seed) => seed.userId !== ME_ID).map((seed) => member(seed.userId));
const fillers = (count: number, startId: number) =>
  Array.from({ length: count }, (_, i) =>
    friend(startId + i, `참여자${i + 1}`, listed(`종목${i + 1}`, '종목 소개', daysFromToday(-30))),
  );

const rooms: MockRoom[] = [
  {
    roomId: 1,
    name: '우리끼리 코스피',
    status: 'ONGOING',
    inviteCode: 'URIK001',
    createdAt: daysFromToday(-6),
    startedAt: daysFromToday(-4),
    endAt: daysFromToday(3),
    day: 5,
    members: [me(true, null), ...allFriends()],
  },
  {
    // 1일차 문구("공모가보다") 확인용
    roomId: 2,
    name: '주식 고수들',
    status: 'ONGOING',
    inviteCode: 'GOSU002',
    createdAt: daysFromToday(-3),
    startedAt: daysFromToday(-2),
    endAt: daysFromToday(5),
    day: 1,
    members: [me(false, null), ...allFriends()],
  },
  {
    // 내가 방장. 대기 중인 친구가 있고, 내일 만료되어 만료 배너가 보인다
    roomId: 3,
    name: '동아리 리그',
    status: 'WAITING',
    inviteCode: 'DONG003',
    createdAt: daysFromToday(-6),
    startedAt: null,
    endAt: null,
    day: 0,
    members: [
      me(true, listed('진영케미칼', '실험실에서 하루를 보내는 종목', daysFromToday(-6))),
      member(2, 5),
      member(6),
    ],
  },
  {
    // 내가 아직 상장하지 않은 대기자
    roomId: 4,
    name: '회사 동기 리그',
    status: 'WAITING',
    inviteCode: 'COMP004',
    createdAt: daysFromToday(-3),
    startedAt: null,
    endAt: null,
    day: 0,
    members: [asHost(member(3, 3)), member(4, 2), member(5, 2), member(7, 1), me(false, null)],
  },
  ...[
    { roomId: 5, name: '너희끼리 코스피', count: 3, endedDays: -60, rank: 2 },
    { roomId: 6, name: '리그이름리그이름', count: 7, endedDays: -86, rank: 1 },
    { roomId: 7, name: '리그이름리그이름', count: 10, endedDays: -95, rank: 5 },
  ].map((room): MockRoom => ({
    roomId: room.roomId,
    name: room.name,
    status: 'ENDED',
    inviteCode: `ENDD00${room.roomId}`,
    createdAt: daysFromToday(room.endedDays - 9),
    startedAt: daysFromToday(room.endedDays - 7),
    endAt: daysFromToday(room.endedDays),
    day: LEAGUE_DAYS,
    // 7명까지는 리그 참여자, 넘으면 다른 참여자로 채운다
    members: [
      me(false, null),
      ...allFriends().slice(0, room.count - 1),
      ...fillers(Math.max(0, room.count - leagueMembersMock.length), 40),
    ],
    myRank: room.rank,
  })),
  // 아래는 코드로 참여 확인용 (내가 아직 없는 리그). 코드: KKKK123 정상, FULL001 정원 초과, STRT001 이미 시작
  {
    roomId: 8,
    name: '새로운 리그',
    status: 'WAITING',
    inviteCode: 'KKKK123',
    createdAt: daysFromToday(-1),
    startedAt: null,
    endAt: null,
    day: 0,
    members: [asHost(member(2, 1)), member(3, 1)],
  },
  {
    roomId: 9,
    name: '꽉 찬 리그',
    status: 'WAITING',
    inviteCode: 'FULL001',
    createdAt: daysFromToday(-1),
    startedAt: null,
    endAt: null,
    day: 0,
    members: fillers(MAX_MEMBERS, 60).map((member, i) => (i === 0 ? asHost(member) : member)),
  },
  {
    roomId: 10,
    name: '이미 시작한 리그',
    status: 'ONGOING',
    inviteCode: 'STRT001',
    createdAt: daysFromToday(-3),
    startedAt: daysFromToday(-1),
    endAt: daysFromToday(6),
    day: 2,
    members: fillers(4, 80),
  },
];

// 미리보기는 되지만 입장하려는 사이에 삭제된 대기실 확인용
const DELETED_ON_JOIN_CODE = 'DELE001';
// 대기실 정보 조회 실패(서버 오류) 확인용
const SERVER_ERROR_CODE = 'FAIL500';

const fail = (code: RoomErrorCode | StockErrorCode, status = 400): never => {
  throw createMockApiError(code, code, status);
};

const isMe = (member: MockMember) => member.userId === ME_ID;
const findRoom = (roomId: RoomId) => rooms.find((room) => room.roomId === roomId);
const getRoomOrFail = (roomId: RoomId) => findRoom(roomId) ?? fail('ROOM_DELETED', 404);
const myRooms = () => rooms.filter((room) => room.members.some(isMe));
const countListed = (room: MockRoom) => room.members.filter((member) => member.stock).length;
const expiresAtOf = (room: MockRoom) =>
  new Date(Date.parse(room.createdAt) + WAITING_ROOM_LIFETIME_DAYS * DAY_MS).toISOString();
const activeRoomCount = () => myRooms().filter((room) => room.status !== 'ENDED').length;
// 리그 종료 시각: 시작한 KST 날짜 + 7일, 09:00 KST(= 00:00 UTC) (서비스 정책 2.3)
const getLeagueEndAt = (start: Date) => {
  const kstDay = Math.floor((start.getTime() + 9 * 60 * 60 * 1000) / DAY_MS);
  return new Date((kstDay + LEAGUE_DAYS) * DAY_MS).toISOString();
};
const randomInviteCode = () => {
  const letters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  ).join('');
  return `${letters}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
};
const removeRoom = (roomId: RoomId) => {
  const index = rooms.findIndex((room) => room.roomId === roomId);
  if (index >= 0) rooms.splice(index, 1);
};
const findMyMember = (room: MockRoom) => room.members.find(isMe) ?? fail('ROOM_DELETED', 404);
const assertUniqueStockName = (room: MockRoom, name: string) => {
  if (room.members.some((member) => !isMe(member) && member.stock?.name === name)) {
    fail('STOCK_NAME_DUPLICATED');
  }
};

export const mockRoomServer = {
  getMyRooms: (): MyRoomsResponse => {
    const mine = myRooms();
    return {
      ongoing: mine
        .filter((room) => room.status === 'ONGOING')
        .map((room) => ({
          roomId: room.roomId,
          name: room.name,
          participantCount: room.members.length,
          startedAt: room.startedAt ?? room.createdAt,
          endAt: room.endAt ?? room.createdAt,
        })),
      waiting: mine
        .filter((room) => room.status === 'WAITING')
        .map((room) => ({
          roomId: room.roomId,
          name: room.name,
          listedCount: countListed(room),
          isListed: Boolean(findMyMember(room).stock),
          createdAt: room.createdAt,
          expiresAt: expiresAtOf(room),
        })),
      ended: mine
        .filter((room) => room.status === 'ENDED')
        .map((room) => ({
          roomId: room.roomId,
          name: room.name,
          participantCount: room.members.length,
          endedAt: room.endAt ?? room.createdAt,
          rank: room.myRank ?? 1,
        })),
    };
  },

  getRoom: (roomId: RoomId): RoomDetail => {
    const room = getRoomOrFail(roomId);
    return {
      roomId: room.roomId,
      name: room.name,
      status: room.status,
      day: room.day,
      endAt: room.endAt,
    };
  },

  getWaitingRoom: (roomId: RoomId): WaitingRoomDetail => {
    const room = getRoomOrFail(roomId);
    return structuredClone({
      roomId: room.roomId,
      name: room.name,
      inviteCode: room.inviteCode,
      expiresAt: expiresAtOf(room),
      members: room.members.map((member) => ({
        ...member,
        name: isMe(member) ? meMock.name : member.name,
        isMe: isMe(member),
      })),
    });
  },

  createRoom: (request: CreateRoomRequest): CreateRoomResponse => {
    if (activeRoomCount() >= MAX_ACTIVE_ROOMS) fail('ACTIVE_ROOM_LIMIT_EXCEEDED');
    const roomId = Math.max(...rooms.map((room) => room.roomId)) + 1;
    const now = new Date().toISOString();
    rooms.push({
      roomId,
      name: request.name,
      status: 'WAITING',
      inviteCode: randomInviteCode(),
      createdAt: now,
      startedAt: null,
      endAt: null,
      day: 0,
      members: [me(true, listed(request.stock.name, request.stock.description, now))],
    });
    return { roomId };
  },

  getInvitePreview: (inviteCode: string): InvitePreview => {
    if (inviteCode === SERVER_ERROR_CODE)
      throw createMockApiError('INTERNAL_SERVER_ERROR', '', 500);
    if (inviteCode === DELETED_ON_JOIN_CODE) {
      return { roomId: 999, name: '곧 사라질 리그', listedCount: 3 };
    }
    const room = rooms.find((item) => item.inviteCode === inviteCode);
    if (!room) return fail('INVALID_INVITE_CODE');
    return { roomId: room.roomId, name: room.name, listedCount: countListed(room) };
  },

  joinRoom: ({ inviteCode }: JoinRoomRequest): JoinRoomResponse => {
    if (inviteCode === DELETED_ON_JOIN_CODE) fail('ROOM_DELETED');
    const room =
      rooms.find((item) => item.inviteCode === inviteCode) ?? fail('INVALID_INVITE_CODE');
    if (room.members.some(isMe)) return { roomId: room.roomId };
    if (room.status !== 'WAITING') fail('ROOM_ALREADY_STARTED');
    if (room.members.length >= MAX_MEMBERS) fail('ROOM_FULL');
    if (activeRoomCount() >= MAX_ACTIVE_ROOMS) fail('ACTIVE_ROOM_LIMIT_EXCEEDED');
    room.members.push(me(false, null));
    return { roomId: room.roomId };
  },

  updateRoomName: (roomId: RoomId, { name }: UpdateRoomNameRequest) => {
    getRoomOrFail(roomId).name = name;
  },

  deleteRoom: (roomId: RoomId) => {
    removeRoom(roomId);
  },

  // 방장이 나가면 상장을 가장 먼저 한 친구가 방장이 되고, 남은 참여자가 없으면 대기실이 사라진다 (서비스 정책 2.2)
  leaveRoom: (roomId: RoomId) => {
    const room = getRoomOrFail(roomId);
    const wasHost = findMyMember(room).isHost;
    room.members = room.members.filter((member) => !isMe(member));
    if (!wasHost) return;
    const nextHost = room.members
      .filter((member) => member.stock)
      .sort((a, b) => Date.parse(a.stock?.listedAt ?? '') - Date.parse(b.stock?.listedAt ?? ''))[0];
    if (nextHost) nextHost.isHost = true;
    else removeRoom(roomId);
  },

  kickMember: (roomId: RoomId, userId: UserId) => {
    const room = getRoomOrFail(roomId);
    room.members = room.members.filter((member) => member.userId !== userId);
  },

  startRoom: (roomId: RoomId) => {
    const room = getRoomOrFail(roomId);
    if (room.members.some((member) => !member.stock)) fail('WAITING_MEMBER_EXISTS');
    if (room.members.length < MIN_MEMBERS_TO_START) fail('NOT_ENOUGH_MEMBERS');
    const now = new Date();
    room.status = 'ONGOING';
    room.startedAt = now.toISOString();
    room.endAt = getLeagueEndAt(now);
    room.day = 1;
  },

  listMyStock: (roomId: RoomId, request: ListStockRequest) => {
    const room = getRoomOrFail(roomId);
    assertUniqueStockName(room, request.name);
    findMyMember(room).stock = listed(request.name, request.description, new Date().toISOString());
  },

  updateMyStock: (roomId: RoomId, request: ListStockRequest) => {
    const room = getRoomOrFail(roomId);
    assertUniqueStockName(room, request.name);
    const member = findMyMember(room);
    if (member.stock) member.stock = { ...member.stock, ...request };
  },
};
