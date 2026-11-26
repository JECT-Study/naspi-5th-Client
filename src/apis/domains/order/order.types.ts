// API layer type
// 위: 서버 응답 그대로 (Swagger 주문). 아래: 화면이 쓰는 모양 (order.mapper가 바꾼다)

import type { StockId } from '@/apis/domains/stock/stock.types';

export type OrderId = number;
/** 매수 BUY(구매) / 매도 SELL(판매) */
export type OrderSide = 'BUY' | 'SELL';
/** 시장가 MARKET / 지정가 LIMIT */
export type OrderType = 'MARKET' | 'LIMIT';

/** 주문 API 실패 코드 (Swagger, 403은 백엔드 ErrorCode) */
export const ORDER_ERROR_CODE = {
  /** 09:00 거래일 전환 처리 전 */
  TRADING_DAY_CHANGING: '213',
  /** 주문 가능한 현금 부족 (매수) */
  INSUFFICIENT_CASH: '401',
  /** 매도 가능한 수량 부족 (매도) */
  INSUFFICIENT_SHARES: '402',
  /** 자사주는 1,000주 이상 남겨야 함 (매도) */
  TREASURY_MIN_SHARES: '403',
  /** 가격이 100원 이상 100원 단위가 아님 */
  INVALID_PRICE: '500',
  /** 수량이 1주 미만 */
  INVALID_QUANTITY: '501',
  /** 이미 체결 완료·취소·만료된 주문 (취소) */
  NOT_CANCELABLE: '502',
  /** 가격이 당일 상·하한가를 벗어남 */
  PRICE_OUT_OF_LIMIT: '503',
  /** 주문이 없거나 내 주문이 아님 */
  NOT_FOUND: '504',
} as const;

// ── 서버 응답 ──

/** GET /api/leagues/{leagueId}/orders?status=pending|completed 의 주문 */
export interface OrderListItem {
  orderId: OrderId;
  stockId: StockId;
  stockName: string;
  side: OrderSide;
  type: OrderType;
  orderedAt: string;
  /** 최초 주문 수량 */
  quantity: number;
  /** 지정가 주문 가격. 시장가는 null */
  price: number | null;
  /** 체결·대기·취소 수량. 0주면 null */
  filledQuantity: number | null;
  pendingQuantity: number | null;
  canceledQuantity: number | null;
  /** 체결 단가 (여러 가격이면 평균). 체결이 없으면 null */
  executionPrice: number | null;
  averagedPrice: boolean;
}

export interface OrderListResponse {
  /** 접수 역순 (최신 먼저) */
  orders: OrderListItem[];
}

// 지정가 주문 (POST .../orders/limit)
export interface PlaceLimitOrderRequest {
  stockId: StockId;
  side: OrderSide;
  /** 1주 가격 (100원 단위, 당일 상·하한가 안) */
  price: number;
  quantity: number;
}

// 시장가 주문 (POST .../orders/market)
export interface PlaceMarketOrderRequest {
  stockId: StockId;
  side: OrderSide;
  quantity: number;
}

export interface PlaceOrderResponse {
  orderId: OrderId;
  /**
   * PENDING 대기, PARTIALLY_FILLED 부분 체결, FILLED 체결 완료
   * CANCELED 취소 (지정가: 자전거래 방지, 시장가: 체결 못 한 잔량·전량 취소)
   */
  status: 'PENDING' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'EXPIRED';
  quantity: number;
  /** 미체결 잔여 수량 (취소된 경우 취소된 수량) */
  remainingQuantity: number;
}

// 미체결 주문 취소 (POST .../orders/{orderId}/cancel)
export interface CancelOrderResponse {
  orderId: OrderId;
  quantity: number;
  /** 취소 전에 체결된 수량 (유지) */
  filledQuantity: number;
  /** 취소된 미체결 잔여 수량 */
  canceledQuantity: number;
}

// ── 화면 모양 ──

// 대기 중인 주문
export interface OpenOrder {
  orderId: OrderId;
  stockId: StockId;
  stockName: string;
  side: OrderSide;
  /** 남은(미체결) 수량 */
  quantity: number;
  /** 주문 단가 */
  price: number;
  /** 주문 시각 */
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

export type CreateOrderResponse = PlaceOrderResponse;
