import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { assetQueries } from '@/apis/domains/asset/asset.queries';
import { orderQueries } from '@/apis/domains/order/order.queries';
import type { OpenOrder } from '@/apis/domains/order/order.types';
import { splitAndSortStocks } from '@/apis/domains/stock/stock.utils';
import { userQueries } from '@/apis/domains/user/user.queries';
import HoldingRow from '@/components/stock/HoldingRow';
import { CaretDownIcon, CaretUpIcon, ChevronRightIcon } from '@/components/ui/icons';
import LoadError from '@/components/status/LoadError';
import ListBox from '@/components/ui/ListBox';
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
  const [isOpenOrdersExpanded, setIsOpenOrdersExpanded] = useState(false);

  // 시안 '주문 내역 섹션': 제목 Title3 Grey/8 + 오른쪽 Right 18 Grey/8 (양 끝)
  const orderHistoryLink = (
    <Link
      to={`/leagues/${roomId}/orders`}
      className="flex items-center justify-between text-title3 text-grey-8"
    >
      주문 내역
      <ChevronRightIcon />
    </Link>
  );

  const renderContent = () => {
    if (assets.isPending) {
      // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 자산 요약·보유 주식 자리
      return (
        <>
          <div className="h-43.5 animate-pulse rounded-md bg-grey-0" />
          <div className="h-60 animate-pulse rounded-md bg-grey-0" />
        </>
      );
    }
    // 조회 실패 (내 자산 4): "{이름}님의 자산"(설계서 문구)과 주문 내역 메뉴는 남기고 그 사이 남은 영역 가운데에 다시 시도
    // 시안 조회 실패 화면은 마스코트·문구·다시 시도만 있다
    if (assets.isError) {
      return (
        <>
          <h2 className="text-title3 text-grey-8">{me.data?.name}님의 자산</h2>
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
          <section className="flex flex-col gap-2">
            <h2 className="text-title3 text-grey-8">대기 중인 주문</h2>
            <LoadError size="inline" className="py-6" onRetry={() => openOrders.refetch()} />
          </section>
        )}
        {/* 대기 중인 주문만 접고 펼친다 (디자이너 코멘트). 시안 기본 화면은 접힌 상태(CaretDown)
            제목 줄: Title3 Grey/8 + 오른쪽 Caret 18 Grey/8(좌우 4). 펼치면 8 띄우고 테두리 상자 */}
        {openOrders.data && openOrders.data.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2>
              <button
                type="button"
                aria-expanded={isOpenOrdersExpanded}
                className="flex w-full items-center justify-between text-title3 text-grey-8"
                onClick={() => setIsOpenOrdersExpanded((prev) => !prev)}
              >
                대기 중인 주문
                <span className="px-1">
                  {isOpenOrdersExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
                </span>
              </button>
            </h2>
            {isOpenOrdersExpanded && (
              <ListBox>
                {openOrders.data.map((order) => (
                  <OpenOrderRow key={order.orderId} order={order} onCancel={setCancelTarget} />
                ))}
              </ListBox>
            )}
          </section>
        )}

        {/* 시안 '보유 주식': 제목 Title3 Grey/8, 8 띄우고 테두리 상자 (아코디언 없음) */}
        <section className="flex flex-col gap-2">
          <h2 className="text-title3 text-grey-8">보유 주식</h2>
          <ListBox>
            {holdings.map((holding) => (
              <HoldingRow
                key={holding.stockId}
                holding={holding}
                to={`/leagues/${roomId}/stocks/${holding.stockId}`}
              />
            ))}
          </ListBox>
        </section>

        {orderHistoryLink}
      </>
    );
  };

  return (
    <>
      {/* 시안 '내 자산 콘텐츠': 위아래 8 안에 '자산 및 주문 섹션'(여백 20·24·16, 영역 사이 32) */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
        {/* flex-1: 조회 실패 안내가 남은 영역 가운데에 오도록 */}
        <div className="flex flex-1 flex-col gap-8 px-6 pt-5 pb-4">{renderContent()}</div>
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
