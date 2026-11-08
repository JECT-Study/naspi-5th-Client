import type { MyAssets } from '@/apis/domains/asset/asset.types';
import ChangeRate from '@/components/ChangeRate';
import { getPriceColorClass } from '@/components/priceColor';
import { formatNumber, formatSignedNumber } from '@/utils/format';

interface AssetSummaryProps {
  assets: MyAssets;
}

// {이름}님의 자산: 총자산, 시작보다 손익·수익률, 현금·보유 주식 평가금액
function AssetSummary({ assets }: AssetSummaryProps) {
  return (
    <section>
      <p className="text-sm text-gray-500">{assets.userName}님의 자산</p>
      <p className="mt-1 text-3xl font-bold">{formatNumber(assets.totalAsset)}원</p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          시작보다{' '}
          <span className={getPriceColorClass(assets.profit)}>
            {formatSignedNumber(assets.profit)}원
          </span>
        </span>
        <ChangeRate change={assets.profit} changeRate={assets.profitRate} />
      </div>
      <dl className="mt-5 flex flex-col gap-2 rounded-lg bg-gray-50 px-5 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">현금</dt>
          <dd className="font-bold">{formatNumber(assets.cash)}원</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">보유 주식 평가금액</dt>
          <dd className="font-bold">{formatNumber(assets.stockValue)}원</dd>
        </div>
      </dl>
    </section>
  );
}

export default AssetSummary;
