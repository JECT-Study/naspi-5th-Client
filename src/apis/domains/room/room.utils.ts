import type { MyRoomsResponse, RoomId, WaitingMember } from './room.types';

/** 동시에 참여할 수 있는 리그 수 (대기실 + 진행 중) */
export const MAX_ACTIVE_ROOMS = 5;
/** 리그 개수 제한 토스트 (메인 1-1). 메인 +, 새 리그, 코드로 참여에서 같이 쓴다 */
export const ACTIVE_ROOM_LIMIT_MESSAGE = `대기실을 포함해 최대 ${MAX_ACTIVE_ROOMS}개의 리그에 동시에 참여할 수 있어요.`;
/** 리그를 시작할 수 있는 최소 참여자 수 (서비스 정책 2.2) */
export const MIN_MEMBERS_TO_START = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const LEAGUE_DAYS = 7;

/** 지금 시작하면 끝나는 시각: 시작한 KST 날짜 + 7일, 09:00 KST (서비스 정책 2.3) */
export const getLeagueEndAt = (start: Date): Date => {
  const kstDay = Math.floor((start.getTime() + KST_OFFSET_MS) / DAY_MS);
  // 09:00 KST는 같은 날 00:00 UTC
  return new Date((kstDay + LEAGUE_DAYS) * DAY_MS);
};

/** 대기실 참여자를 내 정보, 상장한 친구(상장 이른 순), 대기 중인 친구로 나눈다 */
export const groupWaitingMembers = (members: WaitingMember[]) => {
  const me = members.find((member) => member.isMe);
  const friends = members.filter((member) => !member.isMe);
  return {
    me,
    listedFriends: friends
      .filter((member) => member.stock)
      .sort((a, b) => Date.parse(a.stock?.listedAt ?? '') - Date.parse(b.stock?.listedAt ?? '')),
    waitingFriends: friends.filter((member) => !member.stock),
  };
};

export const isActiveRoomLimitReached = (rooms: MyRoomsResponse): boolean =>
  rooms.ongoing.length + rooms.waiting.length >= MAX_ACTIVE_ROOMS;

export interface ActiveRoom {
  roomId: RoomId;
  name: string;
  status: 'ONGOING' | 'WAITING';
  /** 정렬 기준: 진행 중이면 리그 시작 시각, 대기 중이면 대기실 생성 시각 */
  since: string;
  /** 진행 중인 리그의 종료 예정 시각 (D-day 표시용). 대기 중이면 null */
  endAt: string | null;
}

/** 진행 중·대기 중 리그를 리그 시작(대기실 생성) 시각이 이른 순으로 (GNB 드로어 나의 리그) */
export const getActiveRooms = (rooms: MyRoomsResponse): ActiveRoom[] =>
  [
    ...rooms.ongoing.map((room) => ({
      roomId: room.roomId,
      name: room.name,
      status: 'ONGOING' as const,
      since: room.startedAt,
      endAt: room.endAt,
    })),
    ...rooms.waiting.map((room) => ({
      roomId: room.roomId,
      name: room.name,
      status: 'WAITING' as const,
      since: room.createdAt,
      endAt: null,
    })),
  ].sort((a, b) => Date.parse(a.since) - Date.parse(b.since));
