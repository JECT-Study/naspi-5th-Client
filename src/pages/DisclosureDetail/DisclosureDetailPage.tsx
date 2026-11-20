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
import CommentInput from '@/components/comment/CommentInput';
import CommentSection from '@/components/comment/CommentSection';
import ConfirmModal from '@/components/overlay/ConfirmModal';
import AttachedImages from '@/components/feed/AttachedImages';
import DisclosureReactions from '@/components/feed/DisclosureReactions';
import Dropdown from '@/components/ui/Dropdown';
import { ChatIcon, MoreIcon } from '@/components/ui/icons';
import LoadError from '@/components/status/LoadError';
import PageHeader from '@/components/header/PageHeader';
import StockAvatar from '@/components/stock/StockAvatar';
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
    if (disclosure.isPending) {
      // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 공시 카드 자리
      return (
        <div className="p-3">
          <div className="h-60 animate-pulse rounded-md bg-grey-0" />
        </div>
      );
    }
    if (disclosure.isError) {
      // 삭제된 공시: 설계서 화면에 있는 문구를 쓴다 (기획 확인 목록). 시안이 없어 조회 실패 문구와 같은 모양
      return (getApiErrorCode(disclosure.error) as DisclosureErrorCode | undefined) ===
        'CONTENT_DELETED' ? (
        <p className="flex flex-1 items-center justify-center text-body1 text-grey-7">
          공시가 삭제되었어요.
        </p>
      ) : (
        <LoadError onRetry={() => disclosure.refetch()} />
      );
    }

    const item = disclosure.data;
    const stockPath = `/leagues/${roomId}/stocks/${item.stockId}`;

    return (
      <>
        {/* 시안 공시(상세) 카드: 흰색, 여백 12, 줄 사이 8
            - 프로필 줄(높이 38): 종목 프로필 32 + 10 + [종목명 | 시간 (Body3 Grey/6, 사이 4, 세로선 10) / 제목 Title4 Grey/8]
              내 공시면 오른쪽 끝에 미트볼(ThreadDots 24 Grey/6)
            - 본문 Body1 Grey/8 (전부 보임) → 첨부 이미지(피드와 같은 장수별 배치) → 댓글 수(왼쪽)·호재/악재(오른쪽) */}
        <article className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2.5">
            {/* 종목 프로필을 누르면 그 종목 차트로 (공시 상세 1) */}
            <Link to={stockPath} aria-label={`${item.stockName} 차트 보기`}>
              <StockAvatar name={item.stockName} className="size-8 text-title4" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-1 text-body3 text-grey-6">
                {/* 종목명도 프로필처럼 그 종목 차트로 */}
                <Link to={stockPath} className="truncate">
                  {item.stockName}
                </Link>
                <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-grey-6" />
                <span className="shrink-0">{formatRelativeTime(new Date(item.createdAt))}</span>
              </div>
              <h2 className="text-title4 text-grey-8">{item.title}</h2>
            </div>
            {item.isMine && (
              // 공시 미트볼 → 드롭다운 '삭제하기' → 확인 모달 (공시 상세 2, 2-1, 2-1-1)
              <Dropdown
                label="공시 메뉴"
                icon={<MoreIcon className="text-grey-6" />}
                buttonClassName="flex"
                items={[{ label: '삭제하기', onSelect: () => setIsDeleteModalOpen(true) }]}
              />
            )}
          </div>
          <p className="text-body1 whitespace-pre-line text-grey-8">{item.content}</p>
          {item.imageUrls.length > 0 && (
            <AttachedImages
              imageUrls={item.imageUrls}
              renderImage={(url, index, layoutClass) => (
                <DisclosureImage
                  key={url}
                  src={url}
                  label={`이미지 ${index + 1} 크게 보기`}
                  className={layoutClass}
                  onOpen={() => setViewerIndex(index)}
                />
              )}
            />
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1 py-0.5 pr-1 text-body2 text-grey-4">
              <ChatIcon />
              {item.commentCount}
            </span>
            <div className="flex gap-2">
              <DisclosureReactions
                roomId={roomId}
                disclosureId={disclosureId}
                myReaction={item.myReaction}
                bullishCount={item.bullishCount}
                bearishCount={item.bearishCount}
              />
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
      {/* 시안 '공시 상세 콘텐츠 영역': 위아래 8, 공시 카드 → 관련 뉴스 카드 → 댓글이 사이 없이 이어진다 */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">{renderContent()}</main>
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
          title="공시를 삭제할까요?"
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
