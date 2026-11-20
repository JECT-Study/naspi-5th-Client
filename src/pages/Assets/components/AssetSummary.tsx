import type { MyAssets } from '@/apis/domains/asset/asset.types';
import { getPriceColorClass } from '@/components/stock/priceColor';
import { formatNumber, formatRate, formatSignedNumber } from '@/utils/format';

interface AssetSummaryProps {
  assets: MyAssets;
}

// 시안 '자산 요약 섹션': [제목·총자산·손익] → 8 → 현금·보유 주식 평가금액 상자
// - 제목 "{이름}님의 자산" Title3 Grey/8, 4 띄우고 총자산 Heading1 Grey/8, 4 띄우고 손익 한 줄 Body1.5
// - 손익: "시작보다" Grey/6 + "+110,200원 (3.0%)" 상승 NSBuy / 하락 NSSell / 보합 Grey/6 (삼각형 없음)
// - 상자: Grey/0 바탕 + Grey/2 테두리, 모서리 6, 여백 12·8, 줄 사이 12. 이름 Title4.5 Grey/6, 금액 Heading4 Grey/8
function AssetSummary({ assets }: AssetSummaryProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-title3 text-grey-8">{assets.userName}님의 자산</h2>
        <p className="text-heading1 text-grey-8">{formatNumber(assets.totalAsset)}원</p>
        <p className="text-body1-5 text-grey-6">
          시작보다{' '}
          <span className={getPriceColorClass(assets.profit)}>
            {formatSignedNumber(assets.profit)}원 ({formatRate(assets.profitRate)})
          </span>
        </p>
      </div>
      <dl className="flex flex-col gap-3 rounded-md border border-grey-2 bg-grey-0 px-2 py-3">
        <div className="flex h-5.5 items-center justify-between gap-2">
          <dt className="text-title4-5 text-grey-6">현금</dt>
          <dd className="text-heading4 text-grey-8">{formatNumber(assets.cash)}원</dd>
        </div>
        <div className="flex h-5.5 items-center justify-between gap-2">
          <dt className="text-title4-5 text-grey-6">보유 주식 평가금액</dt>
          <dd className="text-heading4 text-grey-8">{formatNumber(assets.stockValue)}원</dd>
        </div>
      </dl>
    </section>
  );
}

export default AssetSummary;
