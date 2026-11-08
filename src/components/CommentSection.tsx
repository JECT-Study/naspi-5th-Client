import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentKeys, commentQueries } from '@/apis/domains/comment/comment.queries';
import { deleteComment } from '@/apis/domains/comment/comment.service';
import type { Comment, CommentTargetType } from '@/apis/domains/comment/comment.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { formatRelativeTime } from '@/utils/date';
import ConfirmModal from './ConfirmModal';
import { ReplyIcon, TrashIcon } from './icons';
import LoadError from './LoadError';

interface CommentSectionProps {
  roomId: RoomId;
  targetType: CommentTargetType;
  targetId: number;
  /** 댓글이 지워진 뒤 (상세의 댓글 수 등 다시 조회) */
  onChanged?: () => void;
}

// 공시·뉴스 상세의 댓글 목록 (오래된 순). 내 댓글은 지울 수 있다 (서비스 정책 3.3)
function CommentSection({ roomId, targetType, targetId, onChanged }: CommentSectionProps) {
  const queryClient = useQueryClient();
  const comments = useQuery(commentQueries.list(roomId, targetType, targetId));
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: (comment: Comment) => deleteComment(roomId, comment.commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(roomId, targetType, targetId),
      });
      onChanged?.();
      setDeleteTarget(null);
    },
    meta: { action: '삭제' },
  });

  if (comments.isPending) return <div className="h-16 animate-pulse rounded-lg bg-gray-100" />;
  if (comments.isError) {
    return <LoadError className="py-6" onRetry={() => comments.refetch()} />;
  }

  return (
    <section>
      <ul className="flex flex-col gap-4">
        {comments.data.map((comment) => (
          <li key={comment.commentId} className="flex gap-2">
            <ReplyIcon className="size-4 text-gray-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold">{comment.authorName}</span>
                <span className="ml-auto text-gray-400">
                  {formatRelativeTime(new Date(comment.createdAt))}
                </span>
                {comment.isMine && (
                  <button
                    type="button"
                    aria-label="댓글 삭제"
                    onClick={() => setDeleteTarget(comment)}
                  >
                    <TrashIcon className="size-3.5 text-gray-400" />
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-sm wrap-break-word whitespace-pre-line text-gray-700">
                {comment.content}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {deleteTarget && (
        <ConfirmModal
          title="이 댓글을 정말 삭제하시겠습니까?"
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
