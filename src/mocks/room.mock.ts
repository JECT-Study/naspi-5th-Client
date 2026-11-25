import type {
  CreateLeagueRequest,
  CreateLeagueResponse,
  JoinLeagueResponse,
  JoinRoomRequest,
  LeagueDetailResponse,
  LeagueInfoResponse,
  LeaveLeagueResponse,
  ListedStock,
  MyLeagueResponse,
  RoomErrorCode,
  RoomId,
  RoomStatus,
  TradingDayResponse,
  UpdateRoomNameRequest,
} from '@/apis/domains/room/room.types';
import type {
  ListStockRequest,
  ListStockResponse,
  StockErrorCode,
  StockId,
  StockResponse,
} from '@/apis/domains/stock/stock.types';
import type { UserId } from '@/apis/domains/user/user.types';
import { findMemberMock, leagueMembersMock } from './members.mock';
import { startsWithNoRooms } from './delay';
import { createMockApiError } from './mockError';
import { meMock } from './user.mock';

// 리그 mock: 리그를 메모리에 두고 내 리그 목록·리그 상세·대기실 응답을 여기서 만든다
// 리그 생성·입장·나가기 같은 변경도 이 상태를 고쳐서, 다시 조회하면 바뀐 결과가 나온다
// 실제 API로 옮긴 것(내 리그 목록·상세, 생성, 초대 코드, 입장, 대기실 관리, 종목 상장·수정)은
// msw 핸들러가 부르고 서버 응답 모양(league)으로 돌려준다

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
  /** 종료된 리그의 내 순위 (리그 결과 mock용. 서버 내 리그 목록은 아직 순위를 주지 않는다) */
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
// 내 이름은 meMock에서 읽는다 (이름 수정은 실제 API라 리그 목업에는 반영되지 않는다)
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
    // 상장 3명 + 대기 1명: 대기 중인 친구를 내보내면 리그를 시작할 수 있다
    members: [
      me(true, listed('진영케미칼', '실험실에서 하루를 보내는 종목', daysFromToday(-6))),
      member(2, 5),
      member(4, 4),
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
  // 아래는 코드로 참여 확인용 (내가 아직 없는 리그). 코드: KKKK123 정상, FULL001 정원 초과,
  // STRT001 이미 시작 (208), DELE001 확인 뒤 삭제됨 (입장 때 폐기된 코드 201), FAIL500 서버 오류
  // 이미 입장한 대기실 코드(DONG003)로 입장하면 202 → 그 대기실로 간다
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

// 화면에서 따로 다루지 않아 상수로 두지 않은 서버 코드: 207 방장이 아님, 210 없는 플레이어, 303 이미 상장함, 305 내 종목이 아님
type UnhandledErrorCode = '207' | '210' | '303' | '305';

// 서버처럼 비즈니스 실패도 HTTP 200 + code (백엔드 ErrorCode)
const fail = (code: RoomErrorCode | StockErrorCode | UnhandledErrorCode): never => {
  throw createMockApiError(code, code, 200);
};
const serverError = (): never => {
  throw createMockApiError('999', '서버 내부 오류가 발생했습니다.', 500);
};

const isMe = (member: MockMember) => member.userId === ME_ID;
const findRoom = (roomId: RoomId) => rooms.find((room) => room.roomId === roomId);
const getRoomOrFail = (roomId: RoomId) => findRoom(roomId) ?? fail('204');
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
// 영문 대문자·숫자를 섞은 랜덤 7자 (설계서 v.1.5 대기실 2)
const INVITE_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const randomInviteCode = () =>
  Array.from(
    { length: 7 },
    () => INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)],
  ).join('');
const removeRoom = (roomId: RoomId) => {
  const index = rooms.findIndex((room) => room.roomId === roomId);
  if (index >= 0) rooms.splice(index, 1);
};

// ?mock=empty: 처음 들고 있던 내 리그를 모두 지운다 (새로 만들거나 참여한 리그는 그대로 쌓인다)
if (startsWithNoRooms) {
  for (const room of myRooms()) removeRoom(room.roomId);
}
const findMyMember = (room: MockRoom) => room.members.find(isMe) ?? fail('204');
const assertUniqueStockName = (room: MockRoom, name: string) => {
  if (room.members.some((member) => !isMe(member) && member.stock?.name === name)) {
    fail('302');
  }
};
// 서버 상태 이름: 진행 중은 STARTED
const toLeagueStatus = (status: RoomStatus) => (status === 'ONGOING' ? 'STARTED' : status);
// 시작된 리그의 거래일 (대기실이면 null). 거래일은 매일 09:00(= 00:00 UTC)에 끝난다
const tradingDayOf = (room: MockRoom): TradingDayResponse | null =>
  room.startedAt && room.endAt
    ? {
        dayNumber: room.day,
        totalDays: LEAGUE_DAYS,
        dayEndsAt: room.status === 'ENDED' ? room.endAt : daysFromToday(1),
        startedAt: room.startedAt,
        endsAt: room.endAt,
      }
    : null;
// 방장만, 시작 전에만 (서버 207 방장이 아님, 208 이미 시작된 리그)
const assertWaitingHost = (room: MockRoom) => {
  if (room.status !== 'WAITING') fail('208');
  if (!findMyMember(room).isHost) fail('207');
};

export const mockRoomServer = {
  // ---- 서버 응답 모양 (msw 핸들러가 부른다) ----

  // GET /api/leagues/me (서버처럼 상태가 섞인 한 목록. 종료된 리그의 내 순위는 서버도 아직 주지 않는다)
  getMyLeagues: (): MyLeagueResponse[] =>
    myRooms().map((room) => ({
      leagueId: room.roomId,
      name: room.name,
      status: toLeagueStatus(room.status),
      playerCount: room.members.length,
      // 시작된 리그는 모두 상장한 참여자다 (mock 참여자는 상장 정보 없이 들어 있어 전체 인원으로 센다)
      participantCount: room.status === 'WAITING' ? countListed(room) : room.members.length,
      host: findMyMember(room).isHost,
      listed: Boolean(findMyMember(room).stock),
      joinedAt: room.createdAt,
      createdAt: room.createdAt,
      waitingRoomExpiresAt: room.status === 'WAITING' ? expiresAtOf(room) : null,
      startedAt: room.startedAt,
      endsAt: room.endAt,
      tradingDay: room.status === 'ONGOING' ? tradingDayOf(room) : null,
    })),

  // POST /api/leagues
  createLeague: (request: CreateLeagueRequest): CreateLeagueResponse => {
    if (activeRoomCount() >= MAX_ACTIVE_ROOMS) fail('205');
    const roomId = Math.max(...rooms.map((room) => room.roomId)) + 1;
    const now = new Date().toISOString();
    const inviteCode = randomInviteCode();
    rooms.push({
      roomId,
      name: request.leagueName,
      status: 'WAITING',
      inviteCode,
      createdAt: now,
      startedAt: null,
      endAt: null,
      day: 0,
      members: [me(true, listed(request.stockName, request.stockDescription, now))],
    });
    return { leagueId: roomId, inviteCode };
  },

  // GET /api/leagues/invite-codes/{inviteCode}: 없는 코드 201, 이미 시작·종료된 리그 208
  getLeagueInfo: (inviteCode: string): LeagueInfoResponse => {
    if (inviteCode === SERVER_ERROR_CODE) return serverError();
    if (inviteCode === DELETED_ON_JOIN_CODE) {
      return {
        leagueId: 999,
        name: '곧 사라질 리그',
        status: 'WAITING',
        playerCount: 3,
        participantCount: 3,
      };
    }
    const room = rooms.find((item) => item.inviteCode === inviteCode);
    if (!room) return fail('201');
    if (room.status !== 'WAITING') return fail('208');
    return {
      leagueId: room.roomId,
      name: room.name,
      status: toLeagueStatus(room.status),
      playerCount: room.members.length,
      participantCount: countListed(room),
    };
  },

  // POST /api/leagues/join: 삭제된 대기실은 초대 코드가 폐기되어 201, 이미 시작·종료된 리그 208
  joinLeague: ({ inviteCode }: JoinRoomRequest): JoinLeagueResponse => {
    if (inviteCode === DELETED_ON_JOIN_CODE) fail('201');
    const room = rooms.find((item) => item.inviteCode === inviteCode) ?? fail('201');
    if (room.members.some(isMe)) fail('202');
    if (room.status !== 'WAITING') fail('208');
    if (room.members.length >= MAX_MEMBERS) fail('203');
    if (activeRoomCount() >= MAX_ACTIVE_ROOMS) fail('205');
    room.members.push(me(false, null));
    return { leagueId: room.roomId };
  },

  // ---- 화면 모양 (아직 API로 옮기지 않은 service가 부른다) ----

  /** 리그 결과 mock이 쓰는 종료된 리그의 참여자 수·내 순위. 종료된 리그가 아니면 undefined */
  getEndedRoomSeed: (roomId: RoomId) => {
    const room = findRoom(roomId);
    if (room?.status !== 'ENDED') return undefined;
    return { participantCount: room.members.length, myRank: room.myRank ?? 1 };
  },

  /** 리그 결과 mock이 쓰는 리그 이름·종료 시각 */
  getRoomSummary: (roomId: RoomId) => {
    const room = getRoomOrFail(roomId);
    return { name: room.name, endAt: room.endAt };
  },

  // GET /api/leagues/{leagueId}/detail (참여 일시 순. mock은 들어 있는 순서)
  getLeagueDetail: (roomId: RoomId): LeagueDetailResponse => {
    const room = getRoomOrFail(roomId);
    findMyMember(room);
    const isWaiting = room.status === 'WAITING';
    return structuredClone({
      leagueId: room.roomId,
      name: room.name,
      inviteCode: isWaiting ? room.inviteCode : null,
      waitingRoomExpiresAt: isWaiting ? expiresAtOf(room) : null,
      startable:
        room.members.length >= MIN_MEMBERS_TO_START && room.members.every((member) => member.stock),
      tradingDay: tradingDayOf(room),
      players: room.members.map((member) => ({
        playerId: member.userId,
        name: isMe(member) ? meMock.name : member.name,
        me: isMe(member),
        host: member.isHost,
        listed: Boolean(member.stock),
        joinedAt: room.createdAt,
        listedAt: member.stock?.listedAt ?? null,
        stock: member.stock
          ? {
              stockId: member.stock.stockId,
              name: member.stock.name,
              description: member.stock.description,
            }
          : null,
      })),
    });
  },

  // POST /api/leagues/{leagueId}/name
  renameLeague: (roomId: RoomId, { name }: UpdateRoomNameRequest) => {
    const room = getRoomOrFail(roomId);
    assertWaitingHost(room);
    room.name = name;
    return { leagueId: roomId, name };
  },

  // POST /api/leagues/{leagueId}/delete
  deleteLeague: (roomId: RoomId) => {
    assertWaitingHost(getRoomOrFail(roomId));
    removeRoom(roomId);
    return null;
  },

  // POST /api/leagues/{leagueId}/leave
  // 방장이 나가면 상장을 가장 먼저 한 친구가 방장이 되고, 남은 참여자가 없으면 대기실이 사라진다 (서비스 정책 2.2)
  leaveLeague: (roomId: RoomId): LeaveLeagueResponse => {
    const room = getRoomOrFail(roomId);
    if (room.status !== 'WAITING') fail('208');
    const wasHost = findMyMember(room).isHost;
    room.members = room.members.filter((member) => !isMe(member));
    if (!wasHost) return { leagueId: roomId, waitingRoomDeleted: false };
    const nextHost = room.members
      .filter((member) => member.stock)
      .sort((a, b) => Date.parse(a.stock?.listedAt ?? '') - Date.parse(b.stock?.listedAt ?? ''))[0];
    if (nextHost) nextHost.isHost = true;
    else removeRoom(roomId);
    return { leagueId: roomId, waitingRoomDeleted: !nextHost };
  },

  // POST /api/leagues/{leagueId}/players/{playerId}/kick (mock은 playerId = userId)
  kickPlayer: (roomId: RoomId, playerId: number) => {
    const room = getRoomOrFail(roomId);
    assertWaitingHost(room);
    if (!room.members.some((member) => member.userId === playerId)) fail('210');
    room.members = room.members.filter((member) => member.userId !== playerId);
    return null;
  },

  // POST /api/leagues/{leagueId}/start
  startLeague: (roomId: RoomId) => {
    const room = getRoomOrFail(roomId);
    assertWaitingHost(room);
    // 서버는 대기자가 있는 것과 3명 미만을 같은 206으로 준다
    if (room.members.some((member) => !member.stock)) fail('206');
    if (room.members.length < MIN_MEMBERS_TO_START) fail('206');
    const now = new Date();
    room.status = 'ONGOING';
    room.startedAt = now.toISOString();
    room.endAt = getLeagueEndAt(now);
    room.day = 1;
    return { leagueId: roomId, startedAt: room.startedAt, endsAt: room.endAt };
  },

  // POST /api/leagues/{leagueId}/stocks
  listStock: (roomId: RoomId, request: ListStockRequest): ListStockResponse => {
    const room = getRoomOrFail(roomId);
    if (room.status !== 'WAITING') fail('208');
    const member = findMyMember(room);
    if (member.stock) fail('303');
    assertUniqueStockName(room, request.name);
    member.stock = listed(request.name, request.description, new Date().toISOString());
    return { stockId: member.stock.stockId };
  },

  // POST /api/leagues/{leagueId}/stocks/{stockId}/edit
  editStock: (roomId: RoomId, stockId: StockId, request: ListStockRequest): StockResponse => {
    const room = getRoomOrFail(roomId);
    if (room.status !== 'WAITING') fail('208');
    const member = findMyMember(room);
    const { stock } = member;
    if (stock?.stockId !== stockId) return fail('305');
    assertUniqueStockName(room, request.name);
    member.stock = { ...stock, ...request };
    return { stockId, name: request.name, description: request.description };
  },
};
