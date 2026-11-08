import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { disclosureKeys, disclosureQueries } from '@/apis/domains/disclosure/disclosure.queries';
import {
  deleteDisclosure,
  retryNewsGeneration,
} from '@/apis/domains/disclosure/disclosure.service';
import type { DisclosureErrorCode } from '@/apis/domains/disclosure/disclosure.types';
import { feedKeys } from '@/apis/domains/feed/feed.queries';
import CommentInput from '@/components/CommentInput';
import CommentSection from '@/components/CommentSection';
import ConfirmModal from '@/components/ConfirmModal';
import DisclosureReactions from '@/components/DisclosureReactions';
import { ChatIcon, TrashIcon } from '@/components/icons';
import LoadError from '@/components/LoadError';
import PageHeader from '@/components/PageHeader';
import StockAvatar from '@/components/StockAvatar';
import { useGoBack } from '@/hooks/useGoBack';
import { useRoomId } from '@/hooks/useRoomId';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';
import { formatRelativeTime } from '@/utils/date';
import DisclosureImage from './components/DisclosureImage';
import ImageViewer from './components/ImageViewer';
import RelatedNews from './components/RelatedNews';

// AI 뉴스가 만들어지는 동안 상태를 다시 확인하는 간격
const NEWS_POLLING_MS = 2_000;

// 공시 상세 (Depth 3): 내용·이미지, 호재/악재 반응, 관련 뉴스, 댓글. 내 공시는 삭제할 수 있다
function DisclosureDetailPage() {
  const roomId = useRoomId();
  const disclosureId = Number(useParams().disclosureId);
  const queryClient = useQueryClient();
  const feedPath = `/leagues/${roomId}`;
  const goBack = useGoBack(feedPath);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // 크게 보는 사진의 순번. null이면 닫힘
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const disclosure = useQuery({
    ...disclosureQueries.detail(roomId, disclosureId),
    refetchInterval: (query) =>
      query.state.data?.newsStatus === 'GENERATING' ? NEWS_POLLING_MS : false,
  });

  const refreshContent = () => {
    queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(roomId, disclosureId) });
    queryClient.invalidateQueries({ queryKey: feedKeys.room(roomId) });
  };

  // 실패하면 공통 토스트 (libs/queryClient)
  const retryMutation = useMutation({
    mutationFn: () => retryNewsGeneration(roomId, disclosureId),
    onSuccess: refreshContent,
    meta: { action: '뉴스 생성' },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteDisclosure(roomId, disclosureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.room(roomId) });
      queryClient.removeQueries({ queryKey: disclosureKeys.detail(roomId, disclosureId) });
      notify.success('공시가 삭제되었어요.');
      goBack();
    },
    meta: { action: '삭제' },
  });

  const renderContent = () => {
    if (disclosure.isPending) return <div className="h-60 animate-pulse rounded-lg bg-gray-100" />;
    if (disclosure.isError) {
      // 삭제된 공시: 설계서 화면에 있는 문구를 쓴다 (기획 확인 목록)
      return (getApiErrorCode(disclosure.error) as DisclosureErrorCode | undefined) ===
        'CONTENT_DELETED' ? (
        <p className="flex flex-1 items-center justify-center text-sm text-gray-500">
          공시가 삭제되었어요.
        </p>
      ) : (
        <LoadError onRetry={() => disclosure.refetch()} />
      );
    }

    const item = disclosure.data;

    return (
      <>
        <article className="flex gap-3">
          {/* 종목 프로필을 누르면 그 종목 차트로 (공시 상세 1) */}
          <Link
            to={`/leagues/${roomId}/stocks/${item.stockId}`}
            aria-label={`${item.stockName} 차트 보기`}
            className="self-start"
          >
            <StockAvatar name={item.stockName} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              {/* 종목명도 프로필처럼 그 종목 차트로 */}
              <Link to={`/leagues/${roomId}/stocks/${item.stockId}`} className="font-bold">
                {item.stockName}
              </Link>
              <span className="ml-auto text-gray-400">
                {formatRelativeTime(new Date(item.createdAt))}
              </span>
              {item.isMine && (
                <button
                  type="button"
                  aria-label="공시 삭제"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <TrashIcon className="size-4 text-gray-400" />
                </button>
              )}
            </div>
            <h2 className="font-bold">{item.title}</h2>
            <p className="text-sm whitespace-pre-line text-gray-700">{item.content}</p>
            {item.imageUrls.length > 0 && (
              <ul className="-mr-9 flex gap-2 overflow-x-auto pr-9">
                {item.imageUrls.map((url, index) => (
                  <li key={url} className="shrink-0">
                    <DisclosureImage
                      src={url}
                      label={`이미지 ${index + 1} 크게 보기`}
                      onOpen={() => setViewerIndex(index)}
                    />
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <DisclosureReactions
                roomId={roomId}
                disclosureId={disclosureId}
                myReaction={item.myReaction}
                bullishCount={item.bullishCount}
                bearishCount={item.bearishCount}
              />
              <span className="flex items-center gap-1">
                <ChatIcon className="size-3.5" />
                {item.commentCount}
              </span>
            </div>
          </div>
        </article>

        <RelatedNews
          disclosure={item}
          newsPath={(newsId) => `/leagues/${roomId}/news/${newsId}`}
          isRetrying={retryMutation.isPending}
          onRetry={() => retryMutation.mutate()}
        />

        <CommentSection
          roomId={roomId}
          targetType="DISCLOSURE"
          targetId={disclosureId}
          onChanged={refreshContent}
        />
      </>
    );
  };

  return (
    <>
      <PageHeader title="공시" fallbackTo={feedPath} />
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-9 py-4">
        {renderContent()}
      </main>
      {disclosure.isSuccess && (
        <CommentInput
          roomId={roomId}
          targetType="DISCLOSURE"
          targetId={disclosureId}
          onChanged={refreshContent}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmModal
          title="이 공시를 정말 삭제하시겠습니까?"
          description="발행된 뉴스는 삭제되지 않아요."
          confirmLabel="삭제하기"
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
      {viewerIndex !== null && disclosure.data && (
        <ImageViewer
          images={disclosure.data.imageUrls}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

export default DisclosureDetailPage;
