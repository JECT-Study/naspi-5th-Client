import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { feedKeys } from '@/apis/domains/feed/feed.queries';
import { newsKeys, newsQueries } from '@/apis/domains/news/news.queries';
import Chip from '@/components/ui/Chip';
import CommentInput from '@/components/comment/CommentInput';
import CommentSection from '@/components/comment/CommentSection';
import { RelatedLinkCard, RelatedNoticeCard } from '@/components/feed/RelatedCard';
import FieldMessage from '@/components/ui/FieldMessage';
import { ChatIcon } from '@/components/ui/icons';
import LoadError from '@/components/status/LoadError';
import PageHeader from '@/components/header/PageHeader';
import { useRoomId } from '@/hooks/useRoomId';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/date';

// 뉴스 상세 (Depth 3): AI 공시브리핑·호재/악재, 제목·시간, 내용, 관련 공시(원문 삭제 안내), 댓글
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
    if (news.isPending) {
      // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 뉴스 카드 자리
      return (
        <div className="p-3">
          <div className="h-36 animate-pulse rounded-md bg-grey-0" />
        </div>
      );
    }
    if (news.isError) return <LoadError onRetry={() => news.refetch()} />;

    const item = news.data;
    // 관련 공시 (뉴스 상세 2): 있으면 모두에게, 누르면 공시 상세로 / 원문이 삭제됐으면 모두에게 안내 (2-1)
    const relatedDisclosure = item.sourceDisclosure ? (
      <RelatedLinkCard
        label="관련 공시"
        to={`/leagues/${roomId}/disclosures/${item.sourceDisclosure.disclosureId}`}
        title={item.sourceDisclosure.title}
      />
    ) : item.isSourceDeleted ? (
      <RelatedNoticeCard
        label="관련 공시"
        message={<FieldMessage tone="info">원문 공시가 삭제되었어요.</FieldMessage>}
      />
    ) : null;

    return (
      <>
        {/* 시안 '뉴스 및 관련공시 콘텐츠': Grey/0 바탕 위에 뉴스 카드 → 1 띄우고 관련 공시 카드 */}
        <div className="flex flex-col bg-grey-0">
          {/* 시안 뉴스 카드(피드 뉴스 카드와 같은 모양, "뉴스" 라벨 없음): 흰색, 여백 12, 줄 사이 8
              - [AI 칩 / 호재·악재 칩] → [제목 Title4 Grey/8 / 시간 Body3 Grey/6] → 본문 Body1 Grey/8 (전부) → 댓글 수
              - 시안에 종목 프로필이 없어 넣지 않음 (피드 뉴스 카드와 같음, 기획 공유 목록) */}
          <article className={cn('flex flex-col gap-2 bg-white p-3', relatedDisclosure && 'mb-px')}>
            <div className="flex items-start justify-between gap-2">
              {item.isAiBriefing && <Chip kind="AI" />}
              <Chip kind={item.sentiment} className="ml-auto" />
            </div>
            <div className="flex items-start justify-between gap-0.5">
              <h2 className="min-w-0 text-title4 wrap-break-word text-grey-8">{item.title}</h2>
              <span className="mt-0.5 shrink-0 text-body3 text-grey-6">
                {formatRelativeTime(new Date(item.createdAt))}
              </span>
            </div>
            {/* 띄어쓰기 없는 긴 영문·주소도 줄을 넘겨 화면이 가로로 밀리지 않게 한다 */}
            <p className="text-body1 wrap-break-word whitespace-pre-line text-grey-8">
              {item.content}
            </p>
            <span className="flex items-center gap-1 self-start py-0.5 pr-1 text-body2 text-grey-4">
              <ChatIcon />
              {item.commentCount}
            </span>
          </article>
          {relatedDisclosure}
        </div>

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
      {/* 시안 '뉴스 상세 콘텐츠 영역': 위아래 8, 뉴스 카드 → 관련 공시 카드 → 댓글이 사이 없이 이어진다 */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">{renderContent()}</main>
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
