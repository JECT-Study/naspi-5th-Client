import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { feedKeys } from '@/apis/domains/feed/feed.queries';
import { newsKeys, newsQueries } from '@/apis/domains/news/news.queries';
import CommentInput from '@/components/CommentInput';
import CommentSection from '@/components/CommentSection';
import FieldMessage from '@/components/FieldMessage';
import { ChatIcon, ChevronRightIcon } from '@/components/icons';
import LoadError from '@/components/LoadError';
import PageHeader from '@/components/PageHeader';
import StockAvatar from '@/components/StockAvatar';
import { useRoomId } from '@/hooks/useRoomId';
import { formatRelativeTime } from '@/utils/date';

const SENTIMENT_LABEL = { BULLISH: '호재', BEARISH: '악재' } as const;

// 뉴스 상세 (Depth 3): AI 공시브리핑·호재/악재, 내용, 관련 공시(원문 삭제 안내), 댓글
function NewsDetailPage() {
  const roomId = useRoomId();
  const newsId = Number(useParams().newsId);
  const queryClient = useQueryClient();
  const feedPath = `/leagues/${roomId}`;
  const news = useQuery(newsQueries.detail(roomId, newsId));

  const refreshContent = () => {
    queryClient.invalidateQueries({ queryKey: newsKeys.detail(roomId, newsId) });
    queryClient.invalidateQueries({ queryKey: feedKeys.room(roomId) });
  };

  const renderContent = () => {
    if (news.isPending) return <div className="h-48 animate-pulse rounded-lg bg-gray-100" />;
    if (news.isError) return <LoadError onRetry={() => news.refetch()} />;

    const item = news.data;
    return (
      <>
        <article className="flex gap-3">
          {/* 종목 프로필을 누르면 그 종목 차트로 (뉴스 상세 1) */}
          <Link
            to={`/leagues/${roomId}/stocks/${item.stockId}`}
            aria-label={`${item.stockName} 차트 보기`}
            className="self-start"
          >
            <StockAvatar name={item.stockName} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              {/* 종목명도 프로필처럼 그 종목 차트로 */}
              <Link to={`/leagues/${roomId}/stocks/${item.stockId}`} className="font-bold">
                {item.stockName}
              </Link>
              {item.isAiBriefing && <span className="rounded bg-gray-100 px-1">AI 공시브리핑</span>}
              <span className="ml-auto text-gray-400">
                {formatRelativeTime(new Date(item.createdAt))}
              </span>
              <span className="rounded border px-1">{SENTIMENT_LABEL[item.sentiment]}</span>
            </div>
            <h2 className="font-bold">{item.title}</h2>
            <p className="text-sm whitespace-pre-line text-gray-700">{item.content}</p>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <ChatIcon className="size-3.5" />
              {item.commentCount}
            </span>
          </div>
        </article>

        {(item.sourceDisclosure || item.isSourceDeleted) && (
          <section className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-[10px] text-gray-500">관련 공시</p>
            {item.sourceDisclosure ? (
              <Link
                to={`/leagues/${roomId}/disclosures/${item.sourceDisclosure.disclosureId}`}
                className="mt-1 flex items-center gap-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {item.sourceDisclosure.title}
                </span>
                <ChevronRightIcon className="size-4" />
              </Link>
            ) : (
              <FieldMessage className="mt-1">원문 공시가 삭제되었어요.</FieldMessage>
            )}
          </section>
        )}

        <CommentSection
          roomId={roomId}
          targetType="NEWS"
          targetId={newsId}
          onChanged={refreshContent}
        />
      </>
    );
  };

  return (
    <>
      <PageHeader title="뉴스" fallbackTo={feedPath} />
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-9 py-4">
        {renderContent()}
      </main>
      {news.isSuccess && (
        <CommentInput
          roomId={roomId}
          targetType="NEWS"
          targetId={newsId}
          onChanged={refreshContent}
        />
      )}
    </>
  );
}

export default NewsDetailPage;
