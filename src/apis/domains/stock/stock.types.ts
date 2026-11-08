// API layer type
// API 스펙 확정 전 화면설계서·실시간 문서 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

export type StockId = number;

/** 화면에서 문구를 나눠 보여주는 서버 에러 코드. TODO: BE와 코드 이름 맞추기 */
export type StockErrorCode = 'STOCK_NAME_DUPLICATED';

// 종목 상장·수정 (대기실)
export interface ListStockRequest {
  name: string;
  description: string;
}

// 종목 소개 수정 (리그 진행 중, 내 종목)
export interface UpdateStockDescriptionRequest {
  description: string;
}

// 리그 종목 목록 조회 (시장 탭)
export interface Stock {
  stockId: StockId;
  name: string;
  description: string;
  /** 상장한 사람 이름 */
  ownerName: string;
  /** 내가 상장한 종목인지 */
  isMine: boolean;
  /** 상장 완료 시각 (ISO 8601, UTC). 종목 정렬 기준 */
  listedAt: string;
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
