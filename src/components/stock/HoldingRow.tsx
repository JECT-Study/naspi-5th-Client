import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Holding } from '@/apis/domains/asset/asset.types';
import { formatNumber, formatSignedNumber } from '@/utils/format';
import { getPriceColorClass } from './priceColor';
import StockAvatar from './StockAvatar';

type HoldingRowData = Pick<
  Holding,
  'stockName' | 'isMine' | 'quantity' | 'evaluationAmount' | 'profit' | 'profitRate'
>;

interface HoldingRowProps {
  holding: HoldingRowData;
  /** 종목 화면 경로. 없으면 누를 수 없는 줄 */
  to?: string;
  /** 상장자 본인의 종목 표시 (내 자산: '내 종목', 참여자 최종 자산: '자사주') */
  ownStockLabel?: string;
}

// 보유 주식 한 줄: 종목, 보유 수량(자기 종목 표시), 평가 금액, 평가 손익(수익률)
// 내 자산, 종목 - 내 주식, 참여자 최종 자산에서 쓴다
function HoldingRow({ holding, to, ownStockLabel = '내 종목' }: HoldingRowProps) {
  const content: ReactNode = (
    <>
      <StockAvatar name={holding.stockName} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{holding.stockName}</p>
        <p className="truncate text-sm text-gray-500">
          {formatNumber(holding.quantity)}주{holding.isMine && `/ ${ownStockLabel}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="font-bold">{formatNumber(holding.evaluationAmount)}원</span>
        <span className={`text-sm ${getPriceColorClass(holding.profit)}`}>
          {formatSignedNumber(holding.profit)} ({Math.abs(holding.profitRate).toFixed(1)}%)
        </span>
      </div>
    </>
  );

  return to ? (
    <Link to={to} className="flex items-center gap-3 py-2">
      {content}
    </Link>
  ) : (
    <div className="flex items-center gap-3 py-2">{content}</div>
  );
}

export default HoldingRow;
