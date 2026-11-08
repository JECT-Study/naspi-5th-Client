// API layer type
// API 스펙 확정 전 화면설계서·서비스 정책(2.5 리그 결과) 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

import type { Holding } from '@/apis/domains/asset/asset.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { UserId } from '@/apis/domains/user/user.types';

// 참여자 최종 자산의 보유 주식 (바텀시트)
// isMine은 "바텀시트 주인(그 참여자)이 상장한 종목"인지. listedAt으로 나머지를 상장 이른 순 정렬 (TODO(API): 요청 필드)
export type FinalHolding = Pick<
  Holding,
  | 'stockId'
  | 'stockName'
  | 'isMine'
  | 'listedAt'
  | 'quantity'
  | 'evaluationAmount'
  | 'profit'
  | 'profitRate'
>;

// 리그 결과 조회: 순위표의 각 참여자에 최종 자산(현금·보유 주식)까지 함께 받는다
// 종료된 리그라 값이 바뀌지 않고 참여자가 최대 10명이라, 행을 누를 때 따로 조회하지 않는다
// (따로 조회하면 바텀시트가 올라오는 중에 내용이 바뀌며 높이가 튄다) TODO(API): 백엔드에 요청
export interface Ranking {
  userId: UserId;
  /** 총자산이 같으면 공동 순위 */
  rank: number;
  /** 탈퇴한 사용자는 순위표에 없다 (서버가 빼고 남은 사람끼리 순위를 매긴다) */
  name: string;
  isMe: boolean;
  /** 상장했던 종목 이름 */
  stockName: string;
  /** 상장 완료 일시. 공동 순위면 이른 사람을 위에 둔다 (리그 결과 3). TODO(API): 요청 필드 */
  listedAt: string;
  totalAsset: number;
  profit: number;
  profitRate: number;
  /** 최종 현금 */
  cash: number;
  /** 최종 보유 주식 평가금액 */
  stockValue: number;
  /** 최종 보유 주식 */
  holdings: FinalHolding[];
}

// 거래일별 집계 중 현금, 보유 주식 평가금액, 총자산 3가지로 차트를 그린다 (리그 결과 2)
export interface AssetHistoryPoint {
  /** 일차 시작 시각 (Unix 초, UTC) */
  time: number;
  cash: number;
  stockValue: number;
  totalAsset: number;
}

export interface LeagueResult {
  roomId: RoomId;
  name: string;
  endedAt: string;
  myRank: number;
  myProfit: number;
  myProfitRate: number;
  /** 내 자산 추이 (일차별 총자산) */
  myAssetHistory: AssetHistoryPoint[];
  rankings: Ranking[];
}
