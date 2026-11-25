import { withKstOffset } from '@/utils/date';
import type {
  CreateLeagueRequest,
  CreateRoomRequest,
  InvitePreview,
  LeagueDetailResponse,
  LeagueInfoResponse,
  MyLeagueResponse,
  MyRoomsResponse,
  RoomDetail,
  WaitingRoomDetail,
} from './room.types';

/** 탈퇴한 회원은 서버가 이름을 null로 준다 (화면설계서 표기) */
const WITHDRAWN_NAME = '탈퇴한 사용자';

// 서버(league) ↔ 화면(room) 모양 바꾸기. 일시는 KST에 시간대를 붙여 둔다 (utils/date withKstOffset)

/**
 * 내 리그 목록: 서버는 상태가 섞인 한 목록으로 주고, 화면은 진행 중·대기실·종료로 나눠 쓴다
 * 시작·종료 일시가 비어 있으면(서버 규칙상 없어야 함) 그 리그는 목록에서 뺀다
 */
export const toMyRooms = (leagues: MyLeagueResponse[]): MyRoomsResponse => {
  const result: MyRoomsResponse = { ongoing: [], waiting: [], ended: [] };
  for (const league of leagues) {
    if (league.status === 'WAITING') {
      if (!league.waitingRoomExpiresAt) continue;
      result.waiting.push({
        roomId: league.leagueId,
        name: league.name,
        listedCount: league.participantCount,
        isListed: league.listed,
        createdAt: withKstOffset(league.createdAt),
        expiresAt: withKstOffset(league.waitingRoomExpiresAt),
      });
      continue;
    }
    if (!league.startedAt || !league.endsAt) continue;
    if (league.status === 'STARTED') {
      result.ongoing.push({
        roomId: league.leagueId,
        name: league.name,
        participantCount: league.participantCount,
        startedAt: withKstOffset(league.startedAt),
        endAt: withKstOffset(league.endsAt),
      });
    } else {
      result.ended.push({
        roomId: league.leagueId,
        name: league.name,
        participantCount: league.participantCount,
        endedAt: withKstOffset(league.endsAt),
        rank: null,
      });
    }
  }
  return result;
};

export const toCreateLeagueRequest = ({ name, stock }: CreateRoomRequest): CreateLeagueRequest => ({
  leagueName: name,
  stockName: stock.name,
  stockDescription: stock.description,
});

/**
 * 리그 상세 → 리그 화면 상단(이름, 일차, 종료 시각)
 * 상태는 서버가 주지 않아 거래일로 판단한다: 거래일이 없으면 대기실, 종료 시각이 지났으면 종료
 */
export const toRoomDetail = (league: LeagueDetailResponse): RoomDetail => {
  const { tradingDay } = league;
  const endAt = tradingDay ? withKstOffset(tradingDay.endsAt) : null;
  const isEnded = endAt !== null && Date.parse(endAt) <= Date.now();
  return {
    roomId: league.leagueId,
    name: league.name,
    status: !tradingDay ? 'WAITING' : isEnded ? 'ENDED' : 'ONGOING',
    day: tradingDay?.dayNumber ?? 0,
    endAt,
  };
};

/** 리그 상세 → 대기실 (참여자 중 나는 me로 찾는다) */
export const toWaitingRoom = (league: LeagueDetailResponse): WaitingRoomDetail => ({
  roomId: league.leagueId,
  name: league.name,
  isStarted: league.tradingDay !== null,
  inviteCode: league.inviteCode ?? '',
  expiresAt: league.waitingRoomExpiresAt ? withKstOffset(league.waitingRoomExpiresAt) : '',
  members: league.players.map((player) => ({
    playerId: player.playerId,
    name: player.name ?? WITHDRAWN_NAME,
    isMe: player.me,
    isHost: player.host,
    stock:
      player.stock && player.listedAt
        ? { ...player.stock, listedAt: withKstOffset(player.listedAt) }
        : null,
  })),
});

export const toInvitePreview = (league: LeagueInfoResponse): InvitePreview => ({
  roomId: league.leagueId,
  name: league.name,
  listedCount: league.participantCount,
});
