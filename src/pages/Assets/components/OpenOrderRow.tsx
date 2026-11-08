import type { OpenOrder } from '@/apis/domains/order/order.types';
import { formatKstDateTime } from '@/utils/date';
import { formatNumber } from '@/utils/format';
import StockAvatar from '@/components/StockAvatar';

interface OpenOrderRowProps {
  order: OpenOrder;
  onCancel: (order: OpenOrder) => void;
}

// 대기 중인 주문 한 줄: 종목, {수량}주 {구매/판매}/ 주당 {단가}원, 주문 일시, 취소 (내 자산, 종목 - 내 주식)
function OpenOrderRow({ order, onCancel }: OpenOrderRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <StockAvatar name={order.stockName} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{order.stockName}</p>
        <p className="truncate text-sm text-gray-500">
          {formatNumber(order.quantity)}주 {order.side === 'BUY' ? '구매' : '판매'}/ 주당{' '}
          {formatNumber(order.price)}원
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          className="rounded border px-2 py-0.5 text-xs"
          onClick={() => onCancel(order)}
        >
          취소
        </button>
        <span className="text-[10px] text-gray-400">
          {formatKstDateTime(new Date(order.orderedAt))}
        </span>
      </div>
    </div>
  );
}

export default OpenOrderRow;
