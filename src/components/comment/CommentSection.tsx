import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentKeys, commentQueries } from '@/apis/domains/comment/comment.queries';
import { deleteComment } from '@/apis/domains/comment/comment.service';
import {
  COMMENT_ERROR_CODE,
  type Comment,
  type CommentTarget,
} from '@/apis/domains/comment/comment.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { getApiErrorCode } from '@/libs/apiError';
import ConfirmModal from '@/components/overlay/ConfirmModal';
import Dropdown from '@/components/ui/Dropdown';
import { MoreIcon } from '@/components/ui/icons';
import LoadError from '@/components/status/LoadError';
import CommentRow from './CommentRow';

interface CommentSectionProps {
  roomId: RoomId;
  target: CommentTarget;
  /** 상세 조회에 같이 온 댓글. 있으면 댓글 목록을 따로 부르지 않고 이걸로 시작한다 */
  initialComments?: Comment[];
  /** 댓글 목록이 바뀐 뒤 (새 댓글 목록을 받은 다음). 상세의 댓글 수·피드 갱신에 쓴다 */
  onChanged?: (comments: Comment[]) => void;
}

// 공시·뉴스 상세의 댓글 목록 (오래된 순). 내 댓글은 지울 수 있다 (서비스 정책 3.3)
// 처음 목록은 상세 응답의 comments로 그리고, 쓰거나 지운 뒤에만 댓글 목록 API로 다시 받는다 (Swagger 안내)
function CommentSection({ roomId, target, initialComments, onChanged }: CommentSectionProps) {
  const queryClient = useQueryClient();
  const listKey = commentKeys.list(roomId, target.type, target.id);
  const comments = useQuery({
    ...commentQueries.list(roomId, target),
    initialData: initialComments,
  });
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);

  const refreshComments = async () => {
    await queryClient.invalidateQueries({ queryKey: listKey });
    const latest = queryClient.getQueryData<Comment[]>(listKey);
    if (latest) onChanged?.(latest);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (comment: Comment) => deleteComment(roomId, target, comment.commentId),
    onSuccess: async () => {
      await refreshComments();
      setDeleteTarget(null);
    },
    // 그사이 이미 지워진 댓글(617)이면 목록만 새로 받는다
    onError: (error) => {
      if (getApiErrorCode(error) === COMMENT_ERROR_CODE.NOT_FOUND) {
        void refreshComments();
        setDeleteTarget(null);
      }
    },
    meta: { action: '삭제', handledErrors: [COMMENT_ERROR_CODE.NOT_FOUND] },
  });

  if (comments.isPending) {
    // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 댓글 한 줄 자리
    return (
      <div className="px-3.75 py-3">
        <div className="h-12 animate-pulse rounded-md bg-grey-0" />
      </div>
    );
  }
  if (comments.isError) {
    return <LoadError size="inline" className="py-6" onRetry={() => comments.refetch()} />;
  }

  // 시안: 댓글 줄(72)이 사이 없이 이어진다
  return (
    <section>
      <ul className="flex flex-col">
        {comments.data.map((comment) => (
          <li key={comment.commentId}>
            <CommentRow
              authorName={comment.authorName}
              createdAt={comment.createdAt}
              content={comment.content}
              menu={
                comment.isMine && (
                  // 댓글 미트볼 → 드롭다운 '삭제하기' → 확인 모달 (공시 상세 6, 뉴스 상세 3)
                  <Dropdown
                    label="댓글 메뉴"
                    icon={<MoreIcon size={18} className="text-grey-6" />}
                    buttonClassName="flex"
                    items={[{ label: '삭제하기', onSelect: () => setDeleteTarget(comment) }]}
                  />
                )
              }
            />
          </li>
        ))}
      </ul>
      {deleteTarget && (
        <ConfirmModal
          title="댓글을 삭제할까요?"
          confirmLabel="삭제하기"
          isPending={isPending}
          onConfirm={() => mutate(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}

export default CommentSection;
