import type { OpenOrder } from '@/apis/domains/order/order.types';
import { formatKstDateTime } from '@/utils/date';
import { formatNumber } from '@/utils/format';
import StockAvatar from '@/components/stock/StockAvatar';

interface OpenOrderRowProps {
  order: OpenOrder;
  onCancel: (order: OpenOrder) => void;
}

// 시안 대기중주문: 높이 54, 좌우 4, 양 끝 정렬, 모서리 4
// - 왼쪽(사이 8): 종목 프로필 36 / 종목 이름 Title4 Grey/8, 3 띄우고 "{수량}주 {매수/매도}/주당 {단가}원" Body3 Grey/6
// - 오른쪽(오른쪽 정렬, 사이 1): "취소" 버튼(47×22, 흰색 + Grey/5 테두리, 모서리 6, Body2 Grey/5) / 주문 일시 Body3 Grey/5
// 주문 문구는 시안대로 ("100,000주 매수/주당 22,222원"), 일시는 설계서 공통 형식 (시안 "11.04 19:49")
function OpenOrderRow({ order, onCancel }: OpenOrderRowProps) {
  return (
    <div className="flex h-13.5 items-center justify-between gap-2 rounded px-1">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <StockAvatar name={order.stockName} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <p className="truncate text-title4 text-grey-8">{order.stockName}</p>
          <p className="truncate text-body3 text-grey-6">
            {formatNumber(order.quantity)}주 {order.side === 'BUY' ? '매수' : '매도'}/주당{' '}
            {formatNumber(order.price)}원
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-px">
        <button
          type="button"
          // 시안 47×22: 위아래는 테두리가 여백 1을 대신하고, 좌우는 테두리 포함 12
          className="rounded-md border border-grey-5 bg-white px-2.75 text-body2 text-grey-5"
          onClick={() => onCancel(order)}
        >
          취소
        </button>
        <span className="text-body3 text-grey-5">
          {formatKstDateTime(new Date(order.orderedAt))}
        </span>
      </div>
    </div>
  );
}

export default OpenOrderRow;
