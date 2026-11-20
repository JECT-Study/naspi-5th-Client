import { useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentKeys } from '@/apis/domains/comment/comment.queries';
import { createComment } from '@/apis/domains/comment/comment.service';
import type { CommentTargetType } from '@/apis/domains/comment/comment.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { useAutoHeight } from '@/hooks/useAutoHeight';
import { useMaxLengthInput } from '@/hooks/useMaxLengthInput';
import { cn } from '@/utils/cn';
import CharCounter from '@/components/ui/CharCounter';
import { SendIcon } from '@/components/ui/icons';

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

  const { ref, isOverLimit, handlers } = useMaxLengthInput<HTMLTextAreaElement>({
    maxLength: COMMENT_MAX_LENGTH,
    onChange: (event) => setContent(event.target.value),
  });
  useAutoHeight(ref, content);

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    if (content.trim() && !isPending) mutate(content.trim());
  };

  const showsCounter = content.length >= COMMENT_COUNTER_FROM;

  return (
    // 시안 TextField 댓글: Grey/0 바탕, 위 테두리 Grey/3. 한 줄일 때 높이 54, 줄이 늘면 5줄까지 같이 커진다
    // 위 테두리는 시안처럼 안쪽 선으로 그려 높이에 더하지 않는다 (border를 쓰면 54 → 55)
    <form
      className="flex min-h-13.5 shrink-0 bg-grey-0 shadow-[inset_0_1px_0_var(--color-grey-3)]"
      onSubmit={handleSubmit}
    >
      <div className="relative flex min-w-0 flex-1 items-center">
        {/* 입력 여백 14·16, Title4.5 (안내 문구 Grey/4, 입력값 Grey/8). 글자 수가 보이면 아래 32를 비운다
            높이는 5줄(시안의 100자 상태, 146)까지만 늘고, 줄바꿈을 더 하면 칸 안에서 스크롤한다 */}
        <textarea
          ref={ref}
          aria-label="댓글"
          placeholder="댓글을 입력해 주세요."
          rows={1}
          maxLength={COMMENT_MAX_LENGTH}
          value={content}
          className={cn(
            'block w-full resize-none bg-transparent px-4 pt-3.5 text-title4-5 text-grey-8 outline-none placeholder:text-grey-4',
            // 5줄(100) + 위 14 + 아래 (글자 수 있으면 32, 없으면 14)
            showsCounter ? 'max-h-36.5 pb-8' : 'max-h-32 pb-3.5',
          )}
          {...handlers}
        />
        <CharCounter
          length={content.length}
          max={COMMENT_MAX_LENGTH}
          showFrom={COMMENT_COUNTER_FROM}
          isOverLimit={isOverLimit}
        />
      </div>
      {/* 폭 52 보내기 칸에 흰 Send 24 (여백 15·14). 칸이 높아져도 아이콘은 세로 가운데 (시안 정렬 MAX/CENTER)
          입력이 없으면 Grey/4, 있으면 NSBlue 바탕 */}
      <button
        type="submit"
        aria-label="댓글 보내기"
        className={cn(
          'flex w-13 shrink-0 items-center justify-center px-3.5 py-3.75 text-white',
          content.trim() ? 'bg-ns-blue' : 'bg-grey-4',
        )}
        disabled={!content.trim() || isPending}
      >
        <SendIcon />
      </button>
    </form>
  );
}

export default CommentInput;
