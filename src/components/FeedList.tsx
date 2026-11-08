import type { ReactNode } from 'react';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { FeedItem, FeedResponse } from '@/apis/domains/feed/feed.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import FeedCard, { type FeedCardVariant } from './FeedCard';
import LoadError from './LoadError';
import LoadMoreTrigger from './LoadMoreTrigger';

interface FeedListProps {
  roomId: RoomId;
  query: UseInfiniteQueryResult<InfiniteData<FeedResponse>>;
  /** 목록이 비었을 때 */
  empty: ReactNode;
  /** 마지막 페이지까지 다 불러왔을 때 맨 아래 안내 (리그 피드 4). 없으면 아무것도 안 보인다 */
  end?: ReactNode;
  /** 리그 피드(feed)인지 종목 정보(stock)인지. 카드 디자인 분기용 */
  variant: FeedCardVariant;
}

function FeedSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-4 py-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

const getItemKey = (item: FeedItem) =>
  item.type === 'NEWS' ? `news-${item.newsId}` : `disclosure-${item.disclosureId}`;

// 공시·뉴스 카드 목록 + 무한 스크롤 (리그 피드, 종목 정보)
// 화면설계서 공통: 첫 조회는 스켈레톤, 추가 조회는 목록 아래 스켈레톤, 추가 조회 실패는 목록 아래 다시 시도
function FeedList({ roomId, query, empty, end, variant }: FeedListProps) {
  const { data, isPending, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = query;

  const getItemPath = (item: FeedItem) =>
    item.type === 'NEWS'
      ? `/leagues/${roomId}/news/${item.newsId}`
      : `/leagues/${roomId}/disclosures/${item.disclosureId}`;

  if (isPending) return <FeedSkeleton count={3} />;
  // 첫 조회가 실패하면 데이터가 없다
  if (!data) return <LoadError onRetry={() => refetch()} />;

  const items = data.pages.flatMap((page) => page.items);
  if (items.length === 0) return <>{empty}</>;

  return (
    <>
      <ul className="flex flex-col divide-y">
        {items.map((item) => (
          <li key={getItemKey(item)} className="py-4">
            <FeedCard roomId={roomId} item={item} to={getItemPath(item)} variant={variant} />
          </li>
        ))}
      </ul>
      {isFetchingNextPage && <FeedSkeleton count={1} />}
      {query.isFetchNextPageError && <LoadError className="py-6" onRetry={() => fetchNextPage()} />}
      {hasNextPage && !isFetchingNextPage && !query.isFetchNextPageError && (
        <LoadMoreTrigger onVisible={() => fetchNextPage()} />
      )}
      {!hasNextPage && end}
    </>
  );
}

export default FeedList;
