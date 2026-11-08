import { useEffect, useRef, useState, type RefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router';
import { roomQueries } from '@/apis/domains/room/room.queries';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import PageHeader from '@/components/PageHeader';
import { useRoomId } from '@/hooks/useRoomId';
import { useStockId } from '@/hooks/useStockId';
import { cn } from '@/utils/cn';
import StockHeaderSummary from './components/StockHeaderSummary';
import StockSummary from './components/StockSummary';

const TABS = [
  { to: '', label: '차트', end: true },
  { to: 'info', label: '종목 정보', end: false },
  { to: 'mine', label: '내 주식', end: false },
];

/** target이 스크롤 영역(root) 밖으로 완전히 나갔는지. enabled가 false면(아직 그리기 전) false */
const useIsScrolledOut = (
  rootRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) => {
  const [isOut, setIsOut] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    const target = targetRef.current;
    if (!enabled || !root || !target) return;
    const observer = new IntersectionObserver(([entry]) => setIsOut(!entry.isIntersecting), {
      root,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [rootRef, targetRef, enabled]);
  return enabled && isOut;
};

// 종목 상세 3개 화면(차트, 종목 정보, 내 주식)의 공통 헤더 + 현재가 + 상단 탭
// 상단바만 고정이고, 현재가·탭·내용은 한 덩어리로 스크롤한다. 탭은 스크롤해도 위에 붙어 있다
// 각 화면의 하단 버튼(팔기/사기, 공시 쓰기)은 이 스크롤 영역 안에서 sticky bottom으로 아래에 붙인다
// 탭 이동은 replace라서 뒤로 가기를 누르면 종목에 들어오기 전 화면으로 간다 (주소로 바로 왔으면 시장 탭)
function StockLayout() {
  const roomId = useRoomId();
  const stockId = useStockId();
  const { data: stock } = useQuery(stockQueries.detail(roomId, stockId));
  const { data: room } = useQuery(roomQueries.detail(roomId));
  const scrollRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const isSummaryHidden = useIsScrolledOut(scrollRef, summaryRef, Boolean(stock));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 현재가 박스가 가려지면 헤더 가운데에 종목명 + 가격·등락률 (토스증권처럼) */}
      <PageHeader
        title={stock?.name ?? ''}
        fallbackTo={`/leagues/${roomId}/market`}
        center={stock && <StockHeaderSummary stock={stock} />}
        showCenter={isSummaryHidden}
      />
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {stock ? (
          <div ref={summaryRef}>
            <StockSummary stock={stock} day={room?.day} />
          </div>
        ) : (
          <div className="mx-9 mb-4 h-24 shrink-0 animate-pulse rounded-lg bg-gray-100" />
        )}
        <nav className="sticky top-0 z-20 flex shrink-0 border-b bg-white">
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              replace
              className={({ isActive }) =>
                cn('flex-1 py-3 text-center', isActive && 'border-b-2 border-current font-bold')
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  );
}

export default StockLayout;
