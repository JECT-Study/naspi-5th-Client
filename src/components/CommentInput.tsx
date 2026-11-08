import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentKeys } from '@/apis/domains/comment/comment.queries';
import { createComment } from '@/apis/domains/comment/comment.service';
import type { CommentTargetType } from '@/apis/domains/comment/comment.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import CharCounter from './CharCounter';
import { SendIcon } from './icons';

interface CommentInputProps {
  roomId: RoomId;
  targetType: CommentTargetType;
  targetId: number;
  /** 댓글을 단 뒤 (상세의 댓글 수 등 다시 조회) */
  onChanged?: () => void;
}

/** 댓글 최대 글자 수 (서비스 정책 3.3) */
const COMMENT_MAX_LENGTH = 100;
/** 글자 수를 보여주기 시작하는 글자 수 (화면설계서 공시 상세 7-1, 뉴스 상세 4-1) */
const COMMENT_COUNTER_FROM = 90;

// 상세 화면 맨 아래 댓글 입력. 90자부터 글자 수(100자면 붉게), 보내면 비운다
function CommentInput({ roomId, targetType, targetId, onChanged }: CommentInputProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: (text: string) => createComment(roomId, targetType, targetId, { content: text }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(roomId, targetType, targetId),
      });
      onChanged?.();
    },
    // 실패하면 입력값을 그대로 두고 공통 토스트 (libs/queryClient)
    meta: { action: '전송' },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (content.trim() && !isPending) mutate(content.trim());
  };

  return (
    <form className="flex shrink-0 items-end gap-2 border-t px-7 pt-3 pb-5" onSubmit={handleSubmit}>
      <div className="flex min-w-0 flex-1 flex-col rounded-lg bg-gray-50 px-3 py-2">
        <textarea
          aria-label="댓글"
          placeholder="댓글을 입력해 주세요."
          rows={content ? Math.min(4, content.split('\n').length + 1) : 1}
          maxLength={COMMENT_MAX_LENGTH}
          value={content}
          className="w-full resize-none bg-transparent text-sm outline-none"
          onChange={(event) => setContent(event.target.value)}
        />
        <CharCounter
          length={content.length}
          max={COMMENT_MAX_LENGTH}
          showFrom={COMMENT_COUNTER_FROM}
          className="text-[10px]"
        />
      </div>
      <button
        type="submit"
        aria-label="댓글 보내기"
        className="mb-1 disabled:text-gray-300"
        disabled={!content.trim() || isPending}
      >
        <SendIcon className="size-5" />
      </button>
    </form>
  );
}

export default CommentInput;
