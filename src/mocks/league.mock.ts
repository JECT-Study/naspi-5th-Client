import type { FinalHolding, LeagueResult, Ranking } from '@/apis/domains/league/league.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { leagueMembersMock } from './members.mock';
import { mockRoomServer } from './room.mock';
import { meMock } from './user.mock';

// 리그 결과 mock: 종료된 리그의 참여자 수·내 순위(room mock)에 맞춰 순위표와 자산을 만든다
// 탈퇴한 사용자는 순위 경쟁에서 빠진다: 서버가 순위표에서 빼고 남은 사람끼리 순위를 매겨 보낸다 (2026-11-08 결정)
// 그래서 순위표·참여자 수(메인 카드)에는 탈퇴하지 않은 사람만 있다

const INITIAL_ASSET = 100_000_000;
const DAY_SECONDS = 24 * 60 * 60;
const LEAGUE_DAYS = 7;
// 리그 참여자 mock(members.mock)의 친구들. 참여자가 더 많은 리그는 뒤의 이름으로 채운다
const FRIENDS = [
  ...leagueMembersMock
    .filter((member) => member.userId !== meMock.userId)
    .map((member) => [member.name, member.stockName]),
  ['오세훈', '세훈모터스'],
  ['윤서아', '서아뷰티'],
  ['최지우', '지우엔터'],
];
const MY_STOCK_NAME =
  leagueMembersMock.find((member) => member.userId === meMock.userId)?.stockName ?? '내 종목';

const roundRate = (value: number) => Math.round(value * 10) / 10;

const LISTED_BASE_MS = Date.parse('2026-10-01T00:00:00Z');
// 뒤 순번일수록 먼저 상장한 것으로 친다: 공동 순위(마지막 두 명)가 상장 순으로 뒤집히는지 확인용
const listedAtOf = (index: number, count: number) =>
  new Date(LISTED_BASE_MS + (count - index) * 60_000).toISOString();
const listedAtOfStock = (stockName: string) =>
  leagueMembersMock.find((member) => member.stockName === stockName)?.listedAt ??
  new Date(LISTED_BASE_MS).toISOString();

// 참여자의 최종 보유 주식: 자기 종목 1,000주 + 친구 종목 두 개 (자기 종목과 겹치면 뺀다)
const buildHoldings = (ownStockName: string): FinalHolding[] =>
  [
    { stockId: 1, stockName: ownStockName, isMine: true, quantity: 1_000, price: 10_000 },
    { stockId: 2, stockName: '예림제약', isMine: false, quantity: 200, price: 5_551 },
    { stockId: 3, stockName: '세영바이오', isMine: false, quantity: 170, price: 1_116 },
  ]
    .filter((holding, index) => index === 0 || holding.stockName !== ownStockName)
    .map(({ price, ...holding }) => {
      const evaluationAmount = price * holding.quantity;
      const cost = 10_000 * holding.quantity;
      return {
        ...holding,
        listedAt: listedAtOfStock(holding.stockName),
        evaluationAmount,
        profit: evaluationAmount - cost,
        profitRate: roundRate(((evaluationAmount - cost) / cost) * 100),
      };
    });

const buildRankings = (roomId: RoomId): Ranking[] => {
  const ended = mockRoomServer.getMyRooms().ended.find((room) => room.roomId === roomId);
  const count = Math.max(ended?.participantCount ?? 4, 2);
  const myRank = Math.min(ended?.rank ?? 1, count);
  // 위에서부터 500만 원씩 차이. 마지막 두 명은 같은 금액이라 공동 순위
  const assets = Array.from({ length: count }, (_, i) => 120_000_000 - i * 5_000_000);
  if (count >= 3) assets[count - 1] = assets[count - 2];

  const friends = [...FRIENDS];
  return assets.map((totalAsset, index) => {
    const isMe = index === myRank - 1;
    const [name, stockName] = isMe
      ? [meMock.name, MY_STOCK_NAME]
      : (friends.shift() ?? ['참여자', '종목']);
    const profit = totalAsset - INITIAL_ASSET;
    const holdings = buildHoldings(stockName);
    const stockValue = holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0);
    return {
      userId: isMe ? meMock.userId : 100 + index,
      rank: 1 + assets.filter((asset) => asset > totalAsset).length,
      name,
      isMe,
      stockName,
      listedAt: listedAtOf(index, count),
      totalAsset,
      profit,
      profitRate: roundRate((profit / INITIAL_ASSET) * 100),
      cash: totalAsset - stockValue,
      stockValue,
      holdings,
    };
  });
};

export const mockLeagueServer = {
  getResult: (roomId: RoomId): LeagueResult => {
    const room = mockRoomServer.getRoom(roomId);
    const rankings = buildRankings(roomId);
    const me = rankings.find((ranking) => ranking.isMe) ?? rankings[0];
    const endedAt = room.endAt ?? new Date().toISOString();
    const endSeconds = Math.floor(Date.parse(endedAt) / 1000);
    // 1억에서 시작해 마지막 날 최종 자산으로 끝나는 일차별 추이 (현금 + 보유 주식 평가금액 = 총자산)
    // 첫날은 자사주 1,000주(1천만 원) + 현금 9천만 원, 날이 갈수록 주식 비중이 늘어난다
    const myAssetHistory = Array.from({ length: LEAGUE_DAYS + 1 }, (_, day) => {
      const totalAsset =
        day === LEAGUE_DAYS
          ? me.totalAsset
          : Math.round(INITIAL_ASSET + ((me.totalAsset - INITIAL_ASSET) * day) / LEAGUE_DAYS) +
            (day % 2 === 0 ? 1 : -1) * 1_500_000 * Math.min(day, 1);
      const stockValue = day === 0 ? 10_000_000 : Math.round(totalAsset * (0.25 + day * 0.04));
      return {
        time: endSeconds - (LEAGUE_DAYS - day) * DAY_SECONDS,
        cash: totalAsset - stockValue,
        stockValue,
        totalAsset,
      };
    });
    return {
      roomId,
      name: room.name,
      endedAt,
      myRank: me.rank,
      myProfit: me.profit,
      myProfitRate: me.profitRate,
      myAssetHistory,
      rankings,
    };
  },
};
