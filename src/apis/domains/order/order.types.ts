// API layer type
// API 스펙 확정 전 화면설계서·서비스 정책 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

import type { StockId } from '@/apis/domains/stock/stock.types';

export type OrderId = number;
/** 매수 BUY(구매) / 매도 SELL(판매) */
export type OrderSide = 'BUY' | 'SELL';
/** 시장가 MARKET / 지정가 LIMIT */
export type OrderType = 'MARKET' | 'LIMIT';

/** 화면에서 문구를 나눠 보여주는 서버 에러 코드. TODO: BE와 코드 이름 맞추기 */
export type OrderErrorCode =
  'INSUFFICIENT_CASH' | 'INSUFFICIENT_SHARES' | 'PRICE_OUT_OF_RANGE' | 'ORDER_ALREADY_FILLED';

// 대기 중인 주문 조회
export interface OpenOrder {
  orderId: OrderId;
  stockId: StockId;
  stockName: string;
  side: OrderSide;
  /** 남은(미체결) 수량 */
  quantity: number;
  /** 주문 단가 */
  price: number;
  /** 주문 시각 (ISO 8601, UTC) */
  orderedAt: string;
}

// 주문 생성
export interface CreateOrderRequest {
  stockId: StockId;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  /** 지정가 주문의 1주 가격. 시장가면 없음 */
  price?: number;
}

export interface CreateOrderResponse {
  orderId: OrderId;
}
