import { formatNumber, formatRate, formatSignedNumber } from '@/utils/format';
import { getPriceColorClass } from './priceColor';

interface AssetSummaryProps {
  name: string;
  totalAsset: number;
  /** 시작 자산 대비 평가 손익 */
  profit: number;
  profitRate: number;
  cash: number;
  stockValue: number;
  /** 제목 "{이름}님의 자산"을 그린다. 바텀시트처럼 제목을 따로 그리는 곳은 false */
  showTitle?: boolean;
}

// 시안 '자산 요약 섹션' (내 자산, 리그 결과 참여자 최종 자산 바텀시트)
// [제목·총자산·손익] → 8 → 현금·보유 주식 평가금액 상자
// - 제목 "{이름}님의 자산" Title3 Grey/8, 4 띄우고 총자산 Heading1 Grey/8, 4 띄우고 손익 한 줄 Body1.5
// - 손익: "시작보다" Grey/6 + "+110,200원 (3.0%)" 상승 NSBuy / 하락 NSSell / 보합 Grey/6 (삼각형 없음)
// - 상자: Grey/0 바탕 + Grey/2 테두리, 모서리 6, 여백 12·8, 줄 사이 12. 이름 Title4.5 Grey/6, 금액 Heading4 Grey/8
function AssetSummary({
  name,
  totalAsset,
  profit,
  profitRate,
  cash,
  stockValue,
  showTitle = true,
}: AssetSummaryProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        {showTitle && <h2 className="text-title3 text-grey-8">{name}님의 자산</h2>}
        <p className="text-heading1 text-grey-8">{formatNumber(totalAsset)}원</p>
        <p className="text-body1-5 text-grey-6">
          시작보다{' '}
          <span className={getPriceColorClass(profit)}>
            {formatSignedNumber(profit)}원 ({formatRate(profitRate)})
          </span>
        </p>
      </div>
      <dl className="flex flex-col gap-3 rounded-md border border-grey-2 bg-grey-0 px-2 py-3">
        <div className="flex h-5.5 items-center justify-between gap-2">
          <dt className="text-title4-5 text-grey-6">현금</dt>
          <dd className="text-heading4 text-grey-8">{formatNumber(cash)}원</dd>
        </div>
        <div className="flex h-5.5 items-center justify-between gap-2">
          <dt className="text-title4-5 text-grey-6">보유 주식 평가금액</dt>
          <dd className="text-heading4 text-grey-8">{formatNumber(stockValue)}원</dd>
        </div>
      </dl>
    </section>
  );
}

export default AssetSummary;
