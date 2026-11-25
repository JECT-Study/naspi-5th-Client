import type { MemberStockResponse, Stock } from './stock.types';

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
