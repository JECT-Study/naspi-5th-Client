import { useState } from 'react';
import type { Orderbook, OrderbookLevel } from '@/apis/domains/stock/stock.types';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import ToggleSwitch from './ToggleSwitch';

interface OrderbookTableProps {
  orderbook: Orderbook;
}

// 기본은 최우선 호가 1줄씩, '자세히 보기' 스위치를 켜면 5단계까지
const COLLAPSED_LEVELS = 1;
const EXPANDED_LEVELS = 5;

function LevelRow({ level, side }: { level: OrderbookLevel; side: 'ask' | 'bid' }) {
  return (
    <div className="grid grid-cols-3 py-1.5 text-center text-sm">
      <span className="text-blue-500">{side === 'ask' ? formatNumber(level.quantity) : ''}</span>
      <span className={cn('font-bold', side === 'ask' ? 'text-blue-500' : 'text-red-500')}>
        {formatNumber(level.price)}
      </span>
      <span className="text-red-500">{side === 'bid' ? formatNumber(level.quantity) : ''}</span>
    </div>
  );
}

// 호가: 위쪽 매도(높은 가격이 위), 아래쪽 매수(높은 가격이 위)
function OrderbookTable({ orderbook }: OrderbookTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const levels = isExpanded ? EXPANDED_LEVELS : COLLAPSED_LEVELS;
  const asks = orderbook.asks.slice(0, levels).reverse();
  const bids = orderbook.bids.slice(0, levels);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-bold">호가</h2>
        <ToggleSwitch label="자세히 보기" checked={isExpanded} onChange={setIsExpanded} />
      </div>
      <div className="mt-3 grid grid-cols-3 text-center text-xs text-gray-400">
        <span>매도 수량(주)</span>
        <span>가격(원)</span>
        <span>매수 수량(주)</span>
      </div>
      <div className="mt-1 divide-y">
        <div>
          {asks.length > 0 ? (
            asks.map((level) => <LevelRow key={level.price} level={level} side="ask" />)
          ) : (
            <p className="py-1.5 text-center text-sm text-gray-500">매도 대기 주문이 없어요.</p>
          )}
        </div>
        <div>
          {bids.length > 0 ? (
            bids.map((level) => <LevelRow key={level.price} level={level} side="bid" />)
          ) : (
            <p className="py-1.5 text-center text-sm text-gray-500">매수 대기 주문이 없어요.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default OrderbookTable;
