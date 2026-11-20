import { useEffect, useRef, useState, type RefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router';
import { roomQueries } from '@/apis/domains/room/room.queries';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import PageHeader from '@/components/header/PageHeader';
import TabIndicator from '@/components/ui/TabIndicator';
import { getTabClassName, TAB_LIST_CLASS } from '@/components/ui/tabStyles';
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
  // 등락 줄까지 다 가려지면 축소 상단바로 (사용자 결정, 스크롤 약 112)
  // 화면에서 사라진 현재가·등락률이 그대로 상단바로 옮겨 가도록. 디자이너 코멘트는 종목명 줄이 가려질 때(기준 48)
  // 내용이 짧아 112까지 스크롤되지 않는 화면이 생기면, 탭 아래 영역에 최소 높이를 줘서 보완한다
  const changeRef = useRef<HTMLParagraphElement>(null);
  const isSummaryHidden = useIsScrolledOut(scrollRef, changeRef, Boolean(stock));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 등락 줄까지 다 가려지면 헤더 가운데에 종목명 + 가격·등락률 (시안 Header/종목/최소화) */}
      <PageHeader
        title={stock?.name ?? ''}
        fallbackTo={`/leagues/${roomId}/market`}
        center={stock && <StockHeaderSummary stock={stock} />}
        showCenter={isSummaryHidden}
      />
      {/* 시안 '종목 차트 스크롤 콘텐츠' 위 여백 8은 시세 요약 위 여백에 합쳤다
          (스크롤 영역에 여백을 주면 위에 붙는 탭이 그만큼 내려와 붙어서, 상단바와 탭 사이로 뒤 내용이 비친다) */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {stock ? (
          <StockSummary stock={stock} day={room?.day} changeRef={changeRef} />
        ) : (
          // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 시세 요약 자리
          <div className="mx-6 mt-7 mb-5 h-21 shrink-0 animate-pulse rounded-md bg-grey-0" />
        )}
        {/* 시안 StockTab: 좌우 여백 24 안에 3칸 (360 화면에서 312). 스크롤해도 위에 붙어 있다 */}
        <nav className={cn(TAB_LIST_CLASS, 'sticky top-0 z-20 px-6')}>
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              replace
              className={({ isActive }) => getTabClassName(isActive)}
            >
              {({ isActive }) => (
                <>
                  {tab.label}
                  {isActive && <TabIndicator />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  );
}

export default StockLayout;
