import type { StockDetail } from '@/apis/domains/stock/stock.types';
import ChangeRate from '@/components/ChangeRate';
import { getPriceColorClass } from '@/components/priceColor';
import { formatNumber, formatSignedNumber } from '@/utils/format';

interface StockSummaryProps {
  stock: StockDetail;
  /** 리그 일차. 1일차는 기준가가 공모가라서 문구가 다르다 */
  day: number | undefined;
}

// 상장자, 현재가, 기준가 대비 금액·등락률
function StockSummary({ stock, day }: StockSummaryProps) {
  return (
    <section className="px-9 pb-4">
      <p className="text-sm text-gray-500">{stock.ownerName}님의 종목</p>
      <p className="mt-1 text-3xl font-bold">{formatNumber(stock.price)}원</p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {day === 1 ? '공모가보다' : '어제보다'}{' '}
          <span className={getPriceColorClass(stock.change)}>
            {formatSignedNumber(stock.change)}원
          </span>
        </span>
        <ChangeRate change={stock.change} changeRate={stock.changeRate} />
      </div>
    </section>
  );
}

export default StockSummary;
