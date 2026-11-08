import { Link } from 'react-router';
import type { Stock } from '@/apis/domains/stock/stock.types';
import ChangeRate from '@/components/ChangeRate';
import StockAvatar from '@/components/StockAvatar';
import { formatNumber } from '@/utils/format';

interface StockRowProps {
  stock: Stock;
  /** 종목 차트 경로 */
  to: string;
}

// 종목 이름·소개 + 등락률·현재가
function StockRow({ stock, to }: StockRowProps) {
  return (
    <Link to={to} className="flex items-center gap-3 py-2">
      <StockAvatar name={stock.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{stock.name}</p>
        <p className="truncate text-sm text-gray-500">{stock.description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <ChangeRate change={stock.change} changeRate={stock.changeRate} className="font-bold" />
        <span className="text-sm">{formatNumber(stock.price)}원</span>
      </div>
    </Link>
  );
}

export default StockRow;
