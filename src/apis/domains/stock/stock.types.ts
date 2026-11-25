// API layer type
// API 스펙 확정 전 화면설계서·실시간 문서 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

export type StockId = number;

/** 화면에서 문구를 나눠 보여주는 서버 에러 코드 (백엔드 ErrorCode) */
export const STOCK_ERROR_CODE = {
  /** 같은 리그에 같은 이름의 종목이 있음 */
  NAME_DUPLICATED: '302',
} as const;

export type StockErrorCode = (typeof STOCK_ERROR_CODE)[keyof typeof STOCK_ERROR_CODE];

// 종목 상장·수정 (대기실). POST /api/leagues/{leagueId}/stocks, POST .../stocks/{stockId}/edit 요청
export interface ListStockRequest {
  name: string;
  description: string;
}

// ---- 서버 응답 (Swagger) ----

// POST /api/leagues/{leagueId}/stocks
export interface ListStockResponse {
  stockId: StockId;
}

// 종목 수정 응답, 리그 상세 참여자의 상장 종목
export interface StockResponse {
  stockId: StockId;
  name: string;
  description: string;
}

// GET /api/leagues/{leagueId}/stocks (상장 순), GET .../stocks/{stockId}
// 시세 필드는 리그 시작 전(대기실)에는 모두 null, 종료된 리그는 마지막 거래일 값
export interface MemberStockResponse {
  stockId: StockId;
  name: string;
  description: string;
  /** 상장자 이름. 시작된 리그에서 탈퇴한 상장자면 '탈퇴한 사용자' */
  listerName: string;
  /** 내가 상장한 종목인지 */
  mine: boolean;
  currentPrice: number | null;
  /** 직전 거래일 종가 (첫 거래일은 시초가) */
  basePrice: number | null;
  upperLimitPrice: number | null;
  lowerLimitPrice: number | null;
  /** 기준가 대비 등락액 */
  changeAmount: number | null;
  /** 등락률 (%, 소수점 첫째 자리) */
  changeRate: number | null;
  /** 현재 거래일 거래량 */
  volume: number | null;
}

// 종목 소개 수정 (리그 진행 중, 내 종목)
export interface UpdateStockDescriptionRequest {
  description: string;
}

// 리그 종목 목록 조회 (시장 탭). 서버가 상장 순으로 준다
export interface Stock {
  stockId: StockId;
  name: string;
  description: string;
  /** 상장한 사람 이름 */
  ownerName: string;
  /** 내가 상장한 종목인지 */
  isMine: boolean;
  /** 현재가 = 직전 체결가 */
  price: number;
  /** 기준가 대비 금액 */
  change: number;
  /** 기준가 대비 등락률 (%) */
  changeRate: number;
}

// 종목 상세 조회
export interface OrderbookLevel {
  price: number;
  /** 그 가격에 걸린 미체결 주문 잔량 합계 */
  quantity: number;
}

export interface Orderbook {
  /** 매도 잔량. 낮은 가격부터 */
  asks: OrderbookLevel[];
  /** 매수 잔량. 높은 가격부터 */
  bids: OrderbookLevel[];
}

export interface StockDetail extends Stock {
  basePrice: number;
  upperLimit: number;
  lowerLimit: number;
  orderbook: Orderbook;
}
