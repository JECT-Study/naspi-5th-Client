// API layer type
// 위: 서버 응답 그대로 (Swagger 자산). 아래: 화면이 쓰는 모양 (asset.mapper가 바꾼다)

import type { StockId } from '@/apis/domains/stock/stock.types';

/** 자산 API 실패 코드 (Swagger) */
export const ASSET_ERROR_CODE = {
  /** 자산이 없음 (리그 시작 전) */
  NO_ASSET: '400',
} as const;

// ── 서버 응답 (GET /api/leagues/{leagueId}/assets/me). 금액은 원, 수량은 주 ──

export interface HoldingResponse {
  stockId: StockId;
  stockName: string;
  /** 내 종목(자사주)인지 */
  treasuryStock: boolean;
  /** 보유 수량 */
  quantity: number;
  /** 매도 가능 수량 = 보유 - 매도 주문 중 - (내 종목이면 최소 유지분 1,000주) */
  orderableQuantity: number;
  currentPrice: number;
  /** 평균 매입가 (원 미만 절사) */
  averagePrice: number;
  /** 평가 금액 */
  valuation: number;
  /** 평가 손익 = 평가 금액 - 매입 금액 */
  profit: number;
  /** 수익률 (%) */
  returnRate: number;
}

export interface MyAssetResponse {
  /** 내 플레이어 ID (웹소켓 내 자산 토픽 구독에 쓴다) */
  playerId: number;
  /** 보유 현금 (매수 주문으로 묶인 금액 포함) */
  deposit: number;
  /** 주문 가능 현금 */
  orderableDeposit: number;
  /** 보유 주식 평가 금액 합계 */
  stockValuation: number;
  totalAsset: number;
  /** 총자산 - 1억 원 */
  totalProfit: number;
  /** 총자산 수익률 (%) */
  totalReturnRate: number;
  /** 보유 수량이 있는 종목 (종목 ID 순 = 상장 순) */
  holdings: HoldingResponse[];
}

// ── 화면 모양 ──

// 내 자산 조회
export interface Holding {
  stockId: StockId;
  stockName: string;
  /** 내가 상장한 종목(자사주)인지 */
  isMine: boolean;
  /** 보유 수량 */
  quantity: number;
  /** 평균 매입가 (차트에 선으로 표시) */
  averagePrice: number;
  /** 판매 주문 중인(예약된) 수량 */
  sellingQuantity: number;
  /** 판매 가능 수량 = 보유 - 판매 주문 중 - (내 종목이면 최소 유지분) */
  sellableQuantity: number;
  /** 평가 금액 (현재가 × 보유 수량) */
  evaluationAmount: number;
  /** 평가 손익 (평가 금액 - 매입 금액) */
  profit: number;
  /** 수익률 (%) */
  profitRate: number;
}

export interface MyAssets {
  /** 총자산 = 현금 + 보유 주식 평가금액 */
  totalAsset: number;
  /** 시작(1억 원)보다 늘어난 금액 */
  profit: number;
  profitRate: number;
  /** 보유 현금 (구매 주문으로 묶인 금액 포함) */
  cash: number;
  /** 사용 가능한 현금 = 보유 현금 - 구매 주문 중 금액 */
  availableCash: number;
  /** 보유 주식 평가금액 */
  stockValue: number;
  holdings: Holding[];
}
