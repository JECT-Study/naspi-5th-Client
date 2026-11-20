import { Link } from 'react-router';
import type { Stock } from '@/apis/domains/stock/stock.types';
import ChangeRate from '@/components/stock/ChangeRate';
import StockAvatar from '@/components/stock/StockAvatar';
import { formatNumber } from '@/utils/format';

interface StockRowProps {
  stock: Stock;
  /** 종목 차트 경로 */
  to: string;
}

// 시안 종목 카드: 높이 54, 좌우 4, 사이 8, 모서리 4
// - 종목 프로필 36 / 종목 이름 Title4 Grey/8, 3 띄우고 소개 Body3 Grey/6 (말줄임)
// - 오른쪽(폭 60, 오른쪽 정렬): 현재가 Title2.5 Grey/8, 4 띄우고 등락률 Body2.5 (삼각형과 사이 4)
function StockRow({ stock, to }: StockRowProps) {
  return (
    <Link to={to} className="flex h-13.5 items-center gap-2 rounded px-1">
      <StockAvatar name={stock.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <p className="truncate text-title4 text-grey-8">{stock.name}</p>
        <p className="truncate text-body3 text-grey-6">{stock.description}</p>
      </div>
      <div className="flex min-w-15 shrink-0 flex-col items-end gap-1">
        <span className="text-title2-5 text-grey-8">{formatNumber(stock.price)}원</span>
        <ChangeRate
          change={stock.change}
          changeRate={stock.changeRate}
          className="gap-1 text-body2-5"
        />
      </div>
    </Link>
  );
}

export default StockRow;
