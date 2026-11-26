import type {
  MemberStockResponse,
  OrderBookLevelResponse,
  OrderBookResponse,
  OrderbookLevel,
  Stock,
  StockDetail,
} from './stock.types';

// 서버 종목 → 화면 종목. 시세는 리그 시작 전(대기실)에만 null이라, 그때는 0으로 둔다 (시장 탭은 시작된 리그에서만 보인다)
export const toStock = (stock: MemberStockResponse): Stock => ({
  stockId: stock.stockId,
  name: stock.name,
  description: stock.description,
  ownerName: stock.listerName,
  isMine: stock.mine,
  price: stock.currentPrice ?? 0,
  change: stock.changeAmount ?? 0,
  changeRate: stock.changeRate ?? 0,
});

const toOrderbookLevel = (level: OrderBookLevelResponse): OrderbookLevel => ({
  price: level.orderPrice,
  quantity: level.remainingQuantity,
});

/** 종목 화면: 종목 개별 조회(시세) + 호가 조회를 합친다 */
export const toStockDetail = (
  stock: MemberStockResponse,
  orderbook: OrderBookResponse,
): StockDetail => ({
  ...toStock(stock),
  basePrice: stock.basePrice ?? 0,
  upperLimit: stock.upperLimitPrice ?? 0,
  lowerLimit: stock.lowerLimitPrice ?? 0,
  orderbook: {
    asks: orderbook.asks.map(toOrderbookLevel),
    bids: orderbook.bids.map(toOrderbookLevel),
  },
});
