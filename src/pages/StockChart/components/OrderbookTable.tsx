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

// 시안 호가 줄: 매도 잔량 112 · 가격 96 · 매수 잔량 112 (320 폭 기준 비율), 높이 24, 줄 사이 1
const LEVEL_GRID = 'grid h-6 grid-cols-[112fr_96fr_112fr]';

interface LevelRowProps {
  level: OrderbookLevel;
  side: 'ask' | 'bid';
  /** 보이는 호가 중 가장 큰 잔량. 잔량 막대 길이의 기준 */
  maxQuantity: number;
}

// - 가격: 가운데 Body2, 매도 NSSell / 매수 NSBuy
// - 잔량 칸: 매도는 SubSell2 바탕·왼쪽 정렬, 매수는 SubBuy2 바탕·오른쪽 정렬 (Body2.5 Grey/6, 좌우 4)
// - 잔량 막대(NSSell·NSBuy 15%): 가격 쪽에서 바깥으로 자라고, 바깥 끝 모서리 6
function LevelRow({ level, side, maxQuantity }: LevelRowProps) {
  const isAsk = side === 'ask';
  const ratio = maxQuantity > 0 ? level.quantity / maxQuantity : 0;
  const quantityCell = (
    <div
      className={cn(
        'relative flex items-center px-1',
        isAsk ? 'justify-start bg-sub-sell-2' : 'justify-end bg-sub-buy-2',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0',
          isAsk ? 'right-0 rounded-l-md bg-ns-sell/15' : 'left-0 rounded-r-md bg-ns-buy/15',
        )}
        style={{ width: `${ratio * 100}%` }}
      />
      <span className="relative text-body2-5 text-grey-6">{formatNumber(level.quantity)}</span>
    </div>
  );

  return (
    <div className={LEVEL_GRID}>
      {isAsk ? quantityCell : <span />}
      <span
        className={cn(
          'flex items-center justify-center text-body2',
          isAsk ? 'text-ns-sell' : 'text-ns-buy',
        )}
      >
        {formatNumber(level.price)}
      </span>
      {isAsk ? <span /> : quantityCell}
    </div>
  );
}

function EmptyRow({ children }: { children: string }) {
  return <p className="flex h-6 items-center justify-center text-body2 text-grey-6">{children}</p>;
}

// 시안 호가: 흰 바탕, 여백 16·20, 줄 사이 8
// - 제목 줄(높이 25): "호가" Title1 Grey/8 + 오른쪽 '자세히 보기' 스위치
// - 열 제목(높이 24, 세 칸 같은 폭, Body2): 매도 수량 NSSell · 가격 Grey/6 · 매수 수량 NSBuy
// - 호가 목록: 위쪽 매도(높은 가격이 위), 아래쪽 매수(높은 가격이 위), 줄 사이 1
// - 양쪽 다 비었으면 열 제목 없이 안내 두 줄 (시안 '주문 없음')
function OrderbookTable({ orderbook }: OrderbookTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const levels = isExpanded ? EXPANDED_LEVELS : COLLAPSED_LEVELS;
  const asks = orderbook.asks.slice(0, levels).reverse();
  const bids = orderbook.bids.slice(0, levels);
  // 잔량 막대 길이: 지금 보이는 호가(기본 1줄씩, 자세히 보기 5줄씩) 중 잔량이 가장 많은 줄을 꽉 찬 막대로,
  // 나머지 줄은 그 대비 길이. 매도·매수를 한 기준으로 비교한다
  // (설계서·시안 모두 기준이 없어 이렇게 정함. 기획 공유 없이 이대로 가기로 함)
  const maxQuantity = Math.max(0, ...asks.map((l) => l.quantity), ...bids.map((l) => l.quantity));
  const isEmpty = asks.length === 0 && bids.length === 0;

  return (
    <section className="flex flex-col gap-2 bg-white px-5 py-4">
      <div className="flex h-6.25 items-center justify-between gap-0.5">
        <h2 className="text-title1 text-grey-8">호가</h2>
        <ToggleSwitch label="자세히 보기" checked={isExpanded} onChange={setIsExpanded} />
      </div>
      {isEmpty ? (
        <>
          <EmptyRow>매도 대기 주문이 없어요.</EmptyRow>
          <EmptyRow>매수 대기 주문이 없어요.</EmptyRow>
        </>
      ) : (
        <>
          <div className="grid h-6 grid-cols-3 items-end text-center text-body2">
            <span className="text-ns-sell">매도 수량(주)</span>
            <span className="text-grey-6">가격(원)</span>
            <span className="text-ns-buy">매수 수량(주)</span>
          </div>
          <div className="flex flex-col gap-px">
            {asks.length > 0 ? (
              asks.map((level) => (
                <LevelRow key={level.price} level={level} side="ask" maxQuantity={maxQuantity} />
              ))
            ) : (
              <EmptyRow>매도 대기 주문이 없어요.</EmptyRow>
            )}
            {bids.length > 0 ? (
              bids.map((level) => (
                <LevelRow key={level.price} level={level} side="bid" maxQuantity={maxQuantity} />
              ))
            ) : (
              <EmptyRow>매수 대기 주문이 없어요.</EmptyRow>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default OrderbookTable;
