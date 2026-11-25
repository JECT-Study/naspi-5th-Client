import type { Ranking } from '@/apis/domains/league/league.types';
import { splitMyStock } from '@/apis/domains/stock/stock.utils';
import BottomSheet from '@/components/overlay/BottomSheet';
import AssetSummary from '@/components/stock/AssetSummary';
import HoldingRow from '@/components/stock/HoldingRow';
import ListBox from '@/components/ui/ListBox';

interface ParticipantAssetsSheetProps {
  participant: Ranking;
  onClose: () => void;
}

// 참여자 최종 자산 바텀시트 (리그 결과 3-1): 결과 조회 때 받아 둔 값을 바로 보여준다 (따로 조회하지 않음)
// 보유 주식은 그 참여자가 상장한 종목(자사주)을 먼저, 나머지는 상장이 이른 순 (공통 화면 정책)
// 시안: 내 자산과 같은 자산 요약(제목은 시트 제목) → 18 → 보유 주식(제목 → 8 → 테두리 상자)
function ParticipantAssetsSheet({ participant, onClose }: ParticipantAssetsSheetProps) {
  const { myStock, otherStocks } = splitMyStock(participant.holdings);
  const holdings = myStock ? [myStock, ...otherStocks] : otherStocks;

  return (
    <BottomSheet title={`${participant.name}님의 자산`} onClose={onClose}>
      {/* 시트 제목 아래 4 (내 자산의 제목·총자산 사이와 같게) */}
      <div className="mt-1">
        <AssetSummary
          name={participant.name}
          totalAsset={participant.totalAsset}
          profit={participant.profit}
          profitRate={participant.profitRate}
          cash={participant.cash}
          stockValue={participant.stockValue}
          showTitle={false}
        />
      </div>
      <section className="mt-4.5 flex flex-col gap-2">
        <h3 className="text-title3 text-grey-8">보유 주식</h3>
        <ListBox>
          {holdings.map((holding) => (
            <HoldingRow key={holding.stockId} holding={holding} ownStockLabel="자사주" />
          ))}
        </ListBox>
      </section>
    </BottomSheet>
  );
}

export default ParticipantAssetsSheet;
