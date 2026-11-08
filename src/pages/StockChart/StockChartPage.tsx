import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { assetQueries } from '@/apis/domains/asset/asset.queries';
import { marketQueries } from '@/apis/domains/market/market.queries';
import type { BarInterval } from '@/apis/domains/market/market.types';
import { BAR_INTERVALS } from '@/apis/domains/market/market.utils';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import type { OrderSide } from '@/apis/domains/order/order.types';
import Button from '@/components/Button';
import FloatingFooter from '@/components/FloatingFooter';
import LoadError from '@/components/LoadError';
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
      {/* 스크롤은 StockLayout이 한다 (현재가·탭·내용이 한 덩어리) */}
      <main className="flex flex-1 flex-col gap-8 px-9 py-4">
        {isError ? (
          <LoadError onRetry={handleRetry} />
        ) : (
          <>
            <section>
              <div className="mb-3 flex gap-2">
                {BAR_INTERVALS.map((interval) => (
                  <button
                    key={interval}
                    type="button"
                    aria-pressed={barInterval === interval}
                    className={cn(
                      'rounded px-2 py-0.5 text-sm',
                      barInterval === interval ? 'bg-gray-900 text-white' : 'text-gray-500',
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
                <div className="h-72 animate-pulse rounded-lg bg-gray-100" />
              )}
            </section>
            {stock.data ? (
              <OrderbookTable orderbook={stock.data.orderbook} />
            ) : (
              <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
            )}
          </>
        )}
      </main>
      {/* 이 종목을 갖고 있지 않으면 사기만 보여준다. 종목 화면은 바깥 틀이 스크롤해서 sticky로 띄운다 */}
      <FloatingFooter className="px-9">
        <div className="flex gap-3">
          {hasHolding && (
            <Button variant="secondary" className="flex-1" onClick={() => openOrder('SELL')}>
              팔기
            </Button>
          )}
          <Button className="flex-1" onClick={() => openOrder('BUY')}>
            사기
          </Button>
        </div>
      </FloatingFooter>
    </>
  );
}

export default StockChartPage;
