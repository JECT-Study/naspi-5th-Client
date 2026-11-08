import { useQuery } from '@tanstack/react-query';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import { splitAndSortStocks } from '@/apis/domains/stock/stock.utils';
import LoadError from '@/components/LoadError';
import { useRoomId } from '@/hooks/useRoomId';
import StockRow from './components/StockRow';

// 시장: 내 종목 + 친구 종목. 가격은 RoomLayout이 구독하는 리그 시세로 계속 바뀐다
function MarketPage() {
  const roomId = useRoomId();
  const { data: stocks, isPending, isError, refetch } = useQuery(stockQueries.list(roomId));

  const getStockPath = (stockId: number) => `/leagues/${roomId}/stocks/${stockId}`;

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      );
    }
    if (isError) return <LoadError onRetry={() => refetch()} />;

    const { myStock, otherStocks: friendStocks } = splitAndSortStocks(stocks);

    return (
      <>
        {myStock && (
          <section>
            <h2 className="text-sm text-gray-500">내 종목</h2>
            <StockRow stock={myStock} to={getStockPath(myStock.stockId)} />
          </section>
        )}
        <section className="mt-6">
          <h2 className="text-sm text-gray-500">친구 종목</h2>
          <ul>
            {friendStocks.map((stock) => (
              <li key={stock.stockId}>
                <StockRow stock={stock} to={getStockPath(stock.stockId)} />
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-9 py-6">
      {renderContent()}
    </main>
  );
}

export default MarketPage;
