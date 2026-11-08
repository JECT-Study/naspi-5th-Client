import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { assetQueries } from '@/apis/domains/asset/asset.queries';
import { orderQueries } from '@/apis/domains/order/order.queries';
import type { OpenOrder } from '@/apis/domains/order/order.types';
import { splitAndSortStocks } from '@/apis/domains/stock/stock.utils';
import { userQueries } from '@/apis/domains/user/user.queries';
import HoldingRow from '@/components/HoldingRow';
import { ChevronRightIcon } from '@/components/icons';
import LoadError from '@/components/LoadError';
import { useRoomId } from '@/hooks/useRoomId';
import AssetSummary from './components/AssetSummary';
import OpenOrderRow from './components/OpenOrderRow';
import OrderCancelModal from './components/OrderCancelModal';

// 내 자산: 총자산·손익, 대기 중인 주문(취소), 보유 주식(내 종목 먼저, 나머지는 상장 순), 주문 내역 링크
// 체결되면 RoomLayout의 내 알림 구독이 이 화면의 조회를 다시 한다
function AssetsPage() {
  const roomId = useRoomId();
  const assets = useQuery(assetQueries.mine(roomId));
  const openOrders = useQuery(orderQueries.open(roomId));
  // 자산 조회가 실패해도 "{이름}님의 자산"은 보여 준다 (드로어 등에서 이미 받아 둔 내 정보)
  const me = useQuery(userQueries.me());
  const [cancelTarget, setCancelTarget] = useState<OpenOrder | null>(null);

  const orderHistoryLink = (
    <Link to={`/leagues/${roomId}/orders`} className="flex items-center justify-between font-bold">
      주문 내역
      <ChevronRightIcon />
    </Link>
  );

  const renderContent = () => {
    if (assets.isPending) {
      return <div className="h-48 animate-pulse rounded-lg bg-gray-100" />;
    }
    // 조회 실패 (내 자산 4): "{이름}님의 자산"과 주문 내역 메뉴는 남기고 그 사이에 다시 시도
    if (assets.isError) {
      return (
        <>
          <p className="text-sm text-gray-500">{me.data?.name}님의 자산</p>
          <LoadError onRetry={() => assets.refetch()} />
          {orderHistoryLink}
        </>
      );
    }

    const { myStock, otherStocks } = splitAndSortStocks(assets.data.holdings);
    const holdings = myStock ? [myStock, ...otherStocks] : otherStocks;

    return (
      <>
        <AssetSummary assets={assets.data} />

        {/* 대기 주문이 없으면 영역을 숨긴다 (내 자산 1). 조회에 실패하면 그 자리에서 다시 시도 */}
        {openOrders.isError && (
          <section>
            <h2 className="font-bold">대기 중인 주문</h2>
            <LoadError className="py-6" onRetry={() => openOrders.refetch()} />
          </section>
        )}
        {openOrders.data && openOrders.data.length > 0 && (
          <section>
            <h2 className="font-bold">대기 중인 주문</h2>
            <ul className="mt-2">
              {openOrders.data.map((order) => (
                <li key={order.orderId}>
                  <OpenOrderRow order={order} onCancel={setCancelTarget} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-bold">보유 주식</h2>
          <ul className="mt-2">
            {holdings.map((holding) => (
              <li key={holding.stockId}>
                <HoldingRow holding={holding} to={`/leagues/${roomId}/stocks/${holding.stockId}`} />
              </li>
            ))}
          </ul>
        </section>

        {orderHistoryLink}
      </>
    );
  };

  return (
    <>
      <main className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-9 py-6">
        {renderContent()}
      </main>
      {cancelTarget && (
        <OrderCancelModal
          roomId={roomId}
          order={cancelTarget}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  );
}

export default AssetsPage;
