import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { feedQueries } from '@/apis/domains/feed/feed.queries';
import type { FeedContentType } from '@/apis/domains/feed/feed.types';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import Button from '@/components/Button';
import FeedList from '@/components/FeedList';
import FloatingFooter from '@/components/FloatingFooter';
import LoadError from '@/components/LoadError';
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
      {/* 스크롤은 StockLayout이 한다 (현재가·탭·내용이 한 덩어리) */}
      <main className="flex flex-1 flex-col gap-6 px-9 py-4">
        {stock.data ? (
          <StockIntroduction stock={stock.data} />
        ) : (
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
        )}
        <div className="flex flex-1 flex-col">
          <div role="tablist" className="flex gap-2">
            {CONTENT_TABS.map((tab) => (
              <button
                key={tab.type}
                type="button"
                role="tab"
                aria-selected={contentType === tab.type}
                className={cn(
                  'rounded-full px-3 py-1 text-sm',
                  contentType === tab.type ? 'bg-gray-900 text-white' : 'text-gray-500',
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
            empty={
              <p className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500">
                {activeTab.empty}
              </p>
            }
          />
        </div>
      </main>
      {stock.data?.isMine && (
        <FloatingFooter className="px-9">
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
