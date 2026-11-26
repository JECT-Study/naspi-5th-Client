import type { Holding, HoldingResponse, MyAssetResponse, MyAssets } from './asset.types';

// 서버(자산) → 화면 모양

/**
 * 내 종목(자사주) 최소 유지분 (서비스 정책 5.5). 서버의 매도 가능 수량은 이만큼을 빼고 온다
 * 같은 값이 order.utils MIN_OWN_HOLDING에도 있다 (다른 도메인 값은 가져오지 않는 규칙이라 따로 둔다)
 */
const TREASURY_MIN_SHARES = 1_000;

const toHolding = (holding: HoldingResponse): Holding => {
  const minimum = holding.treasuryStock ? TREASURY_MIN_SHARES : 0;
  return {
    stockId: holding.stockId,
    stockName: holding.stockName,
    isMine: holding.treasuryStock,
    quantity: holding.quantity,
    averagePrice: holding.averagePrice,
    // 서버는 매도 주문 중 수량을 따로 주지 않아 매도 가능 수량에서 거꾸로 구한다 (보유 - 매도 가능 - 최소 유지분)
    sellingQuantity: Math.max(0, holding.quantity - holding.orderableQuantity - minimum),
    sellableQuantity: holding.orderableQuantity,
    evaluationAmount: holding.valuation,
    profit: holding.profit,
    profitRate: holding.returnRate,
  };
};

export const toMyAssets = (assets: MyAssetResponse): MyAssets => ({
  totalAsset: assets.totalAsset,
  profit: assets.totalProfit,
  profitRate: assets.totalReturnRate,
  cash: assets.deposit,
  availableCash: assets.orderableDeposit,
  stockValue: assets.stockValuation,
  holdings: assets.holdings.map(toHolding),
});
