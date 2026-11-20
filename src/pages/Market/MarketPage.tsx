import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import { splitAndSortStocks } from '@/apis/domains/stock/stock.utils';
import LoadError from '@/components/status/LoadError';
import ListBox from '@/components/ui/ListBox';
import { useRoomId } from '@/hooks/useRoomId';
import StockRow from './components/StockRow';

// 시안 묶음: 제목 Title3 Grey/8, 8 띄우고 테두리 상자에 종목 카드
function StockSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-title3 text-grey-8">{title}</h2>
      <ListBox>{children}</ListBox>
    </section>
  );
}

// 시장: 내 종목 + 친구 종목. 가격은 RoomLayout이 구독하는 리그 시세로 계속 바뀐다
function MarketPage() {
  const roomId = useRoomId();
  const { data: stocks, isPending, isError, refetch } = useQuery(stockQueries.list(roomId));

  const getStockPath = (stockId: number) => `/leagues/${roomId}/stocks/${stockId}`;

  const renderContent = () => {
    if (isPending) {
      // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 내 종목 상자(80)·친구 종목 상자 자리
      return (
        <div className="flex flex-col px-6 pt-14">
          <div className="h-20 animate-pulse rounded-md bg-grey-0" />
          <div className="mt-15 h-48 animate-pulse rounded-md bg-grey-0" />
        </div>
      );
    }
    if (isError) return <LoadError onRetry={() => refetch()} />;

    const { myStock, otherStocks: friendStocks } = splitAndSortStocks(stocks);

    // 시안 '시장 종목 섹션': 여백 20·24·16, 내 종목과 친구 종목 사이 32
    return (
      <div className="flex flex-col gap-8 px-6 pt-5 pb-4">
        {myStock && (
          <StockSection title="내 종목">
            <StockRow stock={myStock} to={getStockPath(myStock.stockId)} />
          </StockSection>
        )}
        <StockSection title="친구 종목">
          {friendStocks.map((stock) => (
            <StockRow key={stock.stockId} stock={stock} to={getStockPath(stock.stockId)} />
          ))}
        </StockSection>
      </div>
    );
  };

  // 시안 'Market Content': 위아래 8
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">{renderContent()}</main>
  );
}

export default MarketPage;
