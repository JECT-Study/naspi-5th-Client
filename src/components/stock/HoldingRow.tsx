import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Holding } from '@/apis/domains/asset/asset.types';
import { cn } from '@/utils/cn';
import { formatNumber, formatRate, formatSignedNumber } from '@/utils/format';
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

// 시안 보유주식: 높이 54, 좌우 4, 사이 8, 모서리 4
// - 종목 프로필 36 / 종목 이름 Title4 Grey/8, 3 띄우고 "{수량}주・내 종목" Body3 Grey/6
//   (구분 기호는 시안 "・". 설계서 "{수량}주/ 내 종목"은 띄어쓰기가 어색해 시안을 따름)
// - 오른쪽(오른쪽 정렬, 사이 4): 평가 금액 Title2.5 Grey/8 / 평가 손익 (수익률) Body2.5 등락 색
// 내 자산, 종목 - 내 주식, 참여자 최종 자산에서 쓴다
const ROW_CLASS = 'flex h-13.5 items-center gap-2 rounded px-1';

function HoldingRow({ holding, to, ownStockLabel = '내 종목' }: HoldingRowProps) {
  const content: ReactNode = (
    <>
      <StockAvatar name={holding.stockName} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <p className="truncate text-title4 text-grey-8">{holding.stockName}</p>
        <p className="truncate text-body3 text-grey-6">
          {formatNumber(holding.quantity)}주{holding.isMine && `・${ownStockLabel}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-title2-5 text-grey-8">
          {formatNumber(holding.evaluationAmount)}원
        </span>
        <span className={cn('text-body2-5', getPriceColorClass(holding.profit))}>
          {formatSignedNumber(holding.profit)} ({formatRate(holding.profitRate)})
        </span>
      </div>
    </>
  );

  return to ? (
    <Link to={to} className={ROW_CLASS}>
      {content}
    </Link>
  ) : (
    <div className={ROW_CLASS}>{content}</div>
  );
}

export default HoldingRow;
