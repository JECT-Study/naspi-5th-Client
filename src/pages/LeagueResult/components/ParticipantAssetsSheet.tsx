import type { Ranking } from '@/apis/domains/league/league.types';
import { splitAndSortStocks } from '@/apis/domains/stock/stock.utils';
import BottomSheet from '@/components/BottomSheet';
import ChangeRate from '@/components/ChangeRate';
import HoldingRow from '@/components/HoldingRow';
import { getPriceColorClass } from '@/components/priceColor';
import { formatNumber, formatSignedNumber } from '@/utils/format';

interface ParticipantAssetsSheetProps {
  participant: Ranking;
  onClose: () => void;
}

// 참여자 최종 자산 바텀시트 (리그 결과 3-1): 결과 조회 때 받아 둔 값을 바로 보여준다 (따로 조회하지 않음)
// 보유 주식은 그 참여자가 상장한 종목(자사주)을 먼저, 나머지는 상장이 이른 순 (공통 화면 정책)
function ParticipantAssetsSheet({ participant, onClose }: ParticipantAssetsSheetProps) {
  const { myStock, otherStocks } = splitAndSortStocks(participant.holdings);
  const holdings = myStock ? [myStock, ...otherStocks] : otherStocks;

  return (
    <BottomSheet title={`${participant.name}님의 자산`} onClose={onClose}>
      <p className="text-3xl font-bold">{formatNumber(participant.totalAsset)}원</p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          시작보다{' '}
          <span className={getPriceColorClass(participant.profit)}>
            {formatSignedNumber(participant.profit)}원
          </span>
        </span>
        <ChangeRate change={participant.profit} changeRate={participant.profitRate} />
      </div>

      <dl className="mt-5 flex flex-col gap-2 rounded-lg bg-gray-50 px-5 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">현금</dt>
          <dd className="font-bold">{formatNumber(participant.cash)}원</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">보유 주식 평가금액</dt>
          <dd className="font-bold">{formatNumber(participant.stockValue)}원</dd>
        </div>
      </dl>
      <h3 className="mt-6 font-bold">보유 주식</h3>
      <ul className="mt-2">
        {holdings.map((holding) => (
          <li key={holding.stockId}>
            <HoldingRow holding={holding} ownStockLabel="자사주" />
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

export default ParticipantAssetsSheet;
