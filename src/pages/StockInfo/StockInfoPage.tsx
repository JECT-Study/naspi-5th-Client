import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { feedQueries } from '@/apis/domains/feed/feed.queries';
import type { FeedContentType } from '@/apis/domains/feed/feed.types';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import Button from '@/components/ui/Button';
import FeedList from '@/components/feed/FeedList';
import FloatingFooter from '@/components/ui/FloatingFooter';
import LoadError from '@/components/status/LoadError';
import ErrorIllustration from '@/components/ui/ErrorIllustration';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { useRoomId } from '@/hooks/useRoomId';
import { useStockId } from '@/hooks/useStockId';
import { cn } from '@/utils/cn';
import StockIntroduction from './components/StockIntroduction';

const CONTENT_TABS: { type: FeedContentType; label: string; empty: string }[] = [
  { type: 'DISCLOSURE', label: '공시', empty: '아직 작성된 공시가 없어요.' },
  { type: 'NEWS', label: '뉴스', empty: '아직 발행된 뉴스가 없어요.' },
];

// 종목 - 종목 정보: 종목 소개 + 이 종목의 공시/뉴스 목록(최신순, 10건씩). 내 종목이면 하단 공시 쓰기
function StockInfoPage() {
  const roomId = useRoomId();
  const stockId = useStockId();
  const stock = useQuery(stockQueries.detail(roomId, stockId));
  const [contentType, setContentType] = useState<FeedContentType>('DISCLOSURE');
  const contents = useInfiniteQuery(feedQueries.stock(roomId, stockId, contentType));
  const activeTab = CONTENT_TABS.find((tab) => tab.type === contentType) ?? CONTENT_TABS[0];
  const openOverlay = useOpenOverlay();

  if (stock.isError) {
    return <LoadError onRetry={() => stock.refetch()} />;
  }

  return (
    <>
      {/* 스크롤은 StockLayout이 한다 (현재가·탭·내용이 한 덩어리)
          시안 '종목정보 본문 영역': 탭 아래 8 띄우고 Grey/0 바탕 위에 종목 소개(흰색) → 8 → 공시·뉴스 게시판(흰색) */}
      <main className="mt-2 flex flex-1 flex-col gap-2 bg-grey-0">
        {stock.data ? (
          <StockIntroduction stock={stock.data} />
        ) : (
          // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체)
          <div className="bg-white px-5 py-4">
            <div className="h-16.75 animate-pulse rounded-md bg-grey-0" />
          </div>
        )}
        {/* 시안 '공시·뉴스 게시판': 흰색, 좌우 8 */}
        <section className="flex flex-1 flex-col bg-white px-2">
          {/* 시안 '공시·뉴스 필터 영역': 높이 44, 왼쪽 12·위 8·아래 4, 버튼 사이 8
              버튼 BoxButton: 높이 32, 좌우 10, 모서리 8, Title4.5. 선택 SubBlue1 바탕 NSBlue / 미선택 흰색 + Grey/2 테두리 Grey/5 */}
          <div role="tablist" className="flex h-11 items-center gap-2 pt-2 pb-1 pl-3">
            {CONTENT_TABS.map((tab) => (
              <button
                key={tab.type}
                type="button"
                role="tab"
                aria-selected={contentType === tab.type}
                className={cn(
                  'h-8 rounded-lg px-2.5 text-title4-5',
                  contentType === tab.type
                    ? 'bg-sub-blue-1 text-ns-blue'
                    : 'bg-white text-grey-5 shadow-[inset_0_0_0_1px_var(--color-grey-2)]',
                )}
                onClick={() => setContentType(tab.type)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <FeedList
            variant="stock"
            roomId={roomId}
            query={contents}
            // 시안 '공시 없는 피드 안내': 여백 위 8·좌우 24·아래 20, 마스코트 → 18 → 문구 Body1.5 Grey/7 가운데
            empty={
              <div className="flex flex-col items-center gap-4.5 px-6 pt-2 pb-5 text-center">
                <ErrorIllustration />
                <p className="text-body1-5 text-grey-7">{activeTab.empty}</p>
              </div>
            }
          />
        </section>
      </main>
      {stock.data?.isMine && (
        <FloatingFooter className="px-4.5">
          <Button
            className="w-full"
            onClick={() => openOverlay({ type: 'disclosureCreate', roomId })}
          >
            공시 쓰기
          </Button>
        </FloatingFooter>
      )}
    </>
  );
}

export default StockInfoPage;
