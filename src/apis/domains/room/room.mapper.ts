import { withKstOffset } from '@/utils/date';
import type {
  CreateLeagueRequest,
  CreateRoomRequest,
  InvitePreview,
  LeagueInfoResponse,
  MyLeagueResponse,
  MyRoomsResponse,
} from './room.types';

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

export const toInvitePreview = (league: LeagueInfoResponse): InvitePreview => ({
  roomId: league.leagueId,
  name: league.name,
  listedCount: league.participantCount,
});
