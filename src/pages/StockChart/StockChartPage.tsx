import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { assetQueries } from '@/apis/domains/asset/asset.queries';
import { marketQueries } from '@/apis/domains/market/market.queries';
import type { BarInterval } from '@/apis/domains/market/market.types';
import { BAR_INTERVALS } from '@/apis/domains/market/market.utils';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import type { OrderSide } from '@/apis/domains/order/order.types';
import LoadError from '@/components/status/LoadError';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { useRoomId } from '@/hooks/useRoomId';
import { useStockId } from '@/hooks/useStockId';
import { useStockStream } from '@/hooks/useStockStream';
import { cn } from '@/utils/cn';
import CandleChart from './components/CandleChart';
import OrderbookTable from './components/OrderbookTable';

const INTERVAL_LABELS: Record<BarInterval, string> = { '10m': '10분', '1h': '1시간', '1d': '1일' };

// 차트: 간격별 캔들 + 호가 + 하단 팔기/사기
// 이 화면에 있는 동안만 종목 상세를 구독한다. 현재가는 StockLayout과 같은 캐시를 본다
function StockChartPage() {
  const roomId = useRoomId();
  const stockId = useStockId();
  const [barInterval, setBarInterval] = useState<BarInterval>('10m');
  useStockStream(roomId, stockId);

  const stock = useQuery(stockQueries.detail(roomId, stockId));
  // 간격을 바꾸는 동안에는 이전 간격 차트를 그대로 보여준다
  const bars = useQuery({
    ...marketQueries.bars(roomId, stockId, barInterval),
    placeholderData: keepPreviousData,
  });
  const { data: assets } = useQuery(assetQueries.mine(roomId));
  const holding = assets?.holdings.find((item) => item.stockId === stockId && item.quantity > 0);
  const hasHolding = holding !== undefined;
  const isError = stock.isError || bars.isError;

  const handleRetry = () => {
    if (stock.isError) stock.refetch();
    if (bars.isError) bars.refetch();
  };

  // 주문은 차트 위에 오버레이로 열어서, 닫으면 차트(실시간)가 그대로 이어진다
  const openOverlay = useOpenOverlay();
  const openOrder = (side: OrderSide) => openOverlay({ type: 'order', roomId, stockId, side });

  return (
    <>
      {/* 스크롤은 StockLayout이 한다 (현재가·탭·내용이 한 덩어리)
          시안 '종목 탭·차트·호가 영역': 탭 → 8 → 차트 영역 → 8 → 호가 */}
      <main className="flex flex-1 flex-col gap-2 pt-2">
        {isError ? (
          <LoadError onRetry={handleRetry} />
        ) : (
          <>
            {/* 차트 모양은 시안에 없음 (자리만 있음). 간격 버튼·차트는 임시 모양, 좌우 24 안쪽 */}
            <section className="px-6">
              <div className="mb-3 flex gap-2">
                {BAR_INTERVALS.map((interval) => (
                  <button
                    key={interval}
                    type="button"
                    aria-pressed={barInterval === interval}
                    className={cn(
                      'rounded px-2 py-0.5 text-body2',
                      barInterval === interval ? 'bg-grey-8 text-white' : 'text-grey-5',
                    )}
                    onClick={() => setBarInterval(interval)}
                  >
                    {INTERVAL_LABELS[interval]}
                  </button>
                ))}
              </div>
              {bars.data ? (
                <CandleChart bars={bars.data} averagePrice={holding?.averagePrice} />
              ) : (
                // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체)
                <div className="h-72 animate-pulse rounded-md bg-grey-0" />
              )}
            </section>
            {stock.data ? (
              <OrderbookTable orderbook={stock.data.orderbook} />
            ) : (
              <div className="px-5 py-4">
                <div className="h-28.5 animate-pulse rounded-md bg-grey-0" />
              </div>
            )}
          </>
        )}
      </main>
      {/* 시안 '종목/팔기사기': 떠 있는 버튼이 아니라 흰 바탕 하단 막대 (위 Grey/2 선 1, 여백 위 8·좌우 12·아래 12)
          버튼 48 높이, 사이 8, 모서리 6, Button2 흰 글자. 팔기 NSSell, 사기 NSBuy
          이 종목을 갖고 있지 않으면 사기만 꽉 차게 (시안 '종목/사기'). 종목 화면은 바깥 틀이 스크롤해서 sticky로 붙인다
          시안 선은 크기 안쪽이라 inset 그림자로 그린다 (높이 68). 조회 실패 때는 숨긴다 (설계서·시안 조회 실패 화면) */}
      {!isError && (
        <div className="sticky bottom-0 z-20 mt-auto flex shrink-0 gap-2 bg-white px-3 pt-2 pb-3 shadow-[inset_0_1px_0_var(--color-grey-2)]">
          {hasHolding && (
            <button
              type="button"
              className="flex h-12 flex-1 items-center justify-center rounded-md bg-ns-sell text-button2 text-white"
              onClick={() => openOrder('SELL')}
            >
              팔기
            </button>
          )}
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-md bg-ns-buy text-button2 text-white"
            onClick={() => openOrder('BUY')}
          >
            사기
          </button>
        </div>
      )}
    </>
  );
}

export default StockChartPage;
