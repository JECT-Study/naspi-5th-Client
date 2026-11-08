// API layer type
// API 스펙 확정 전 화면설계서·서비스 정책 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

import type { StockId } from '@/apis/domains/stock/stock.types';

// 내 자산 조회
export interface Holding {
  stockId: StockId;
  stockName: string;
  /** 내가 상장한 종목(자사주)인지 */
  isMine: boolean;
  /** 종목 상장 완료 시각. 종목 정렬 기준 */
  listedAt: string;
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
  userName: string;
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
