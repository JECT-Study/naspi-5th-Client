import type { ReactNode } from 'react';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { FeedItem, FeedResponse } from '@/apis/domains/feed/feed.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import FeedCard, { type FeedCardVariant } from './FeedCard';
import LoadError from '@/components/status/LoadError';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';
import { cn } from '@/utils/cn';

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

// 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 카드 자리를 Grey/0으로 깜빡인다
function FeedSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-40 animate-pulse bg-grey-0" />
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

  // 리그 피드(시안 '공시'): Grey/0 바탕 위에 흰 카드를 8씩 띄워 쌓는다. 화면 좌우 여백 없음 (카드 안 여백은 FeedCard)
  // 종목 정보(시안 '공시·뉴스 게시판'): 흰 게시판 안에 카드를 사이 없이 잇는다 (좌우 여백은 게시판이 준다)
  // 추가 조회 중·실패·피드 끝 안내도 같은 틀 안에 카드처럼 이어 붙인다
  const isFeed = variant === 'feed';
  return (
    <div className={cn('flex flex-col', isFeed ? 'gap-2 bg-grey-0' : 'bg-white')}>
      <ul className={cn('flex flex-col', isFeed && 'gap-2')}>
        {items.map((item) => (
          <li key={getItemKey(item)} className="bg-white">
            <FeedCard roomId={roomId} item={item} to={getItemPath(item)} variant={variant} />
          </li>
        ))}
      </ul>
      {isFetchingNextPage && <FeedSkeleton count={1} />}
      {query.isFetchNextPageError && (
        <LoadError size="inline" className="bg-white py-6" onRetry={() => fetchNextPage()} />
      )}
      {hasNextPage && !isFetchingNextPage && !query.isFetchNextPageError && (
        <LoadMoreTrigger onVisible={() => fetchNextPage()} />
      )}
      {!hasNextPage && end}
    </div>
  );
}

export default FeedList;
