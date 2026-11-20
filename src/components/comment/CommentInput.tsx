import { useRef, useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentKeys } from '@/apis/domains/comment/comment.queries';
import { createComment } from '@/apis/domains/comment/comment.service';
import type { CommentTargetType } from '@/apis/domains/comment/comment.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { useAutoHeight } from '@/hooks/useAutoHeight';
import { cn } from '@/utils/cn';
import { maxLengthHandlers } from '@/utils/maxLength';
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

// 상세 화면 맨 아래 댓글 입력. 글자 수는 처음부터 (100자면 붉게), 보내면 비운다
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

  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoHeight(ref, content);

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    if (content.trim() && !isPending) mutate(content.trim());
  };

  return (
    // 시안 TextField 댓글: Grey/0 바탕, 위 테두리 Grey/3. 한 줄일 때 높이 54, 줄이 늘면 5줄까지 같이 커진다
    // 위 테두리는 시안처럼 안쪽 선으로 그려 높이에 더하지 않는다 (border를 쓰면 54 → 55)
    <form
      className="flex min-h-13.5 shrink-0 bg-grey-0 shadow-[inset_0_1px_0_var(--color-grey-3)]"
      onSubmit={handleSubmit}
    >
      {/* 입력 여백 14·16, Title4.5 (안내 문구 Grey/4, 입력값 Grey/8)
          글자 수는 처음부터 입력 오른쪽 끝(마지막 줄 높이)에 둔다. 한 줄일 때 높이 54가 그대로 유지된다 (자리는 정함)
          높이는 5줄(100) + 위아래 14까지만 늘고, 줄바꿈을 더 하면 칸 안에서 스크롤한다 */}
      <div className="flex min-w-0 flex-1 items-end gap-2 self-center py-3.5 pr-3 pl-4">
        <textarea
          ref={ref}
          aria-label="댓글"
          placeholder="댓글을 입력해 주세요."
          rows={1}
          maxLength={COMMENT_MAX_LENGTH}
          value={content}
          className="block max-h-25 min-w-0 flex-1 resize-none bg-transparent text-title4-5 text-grey-8 outline-none placeholder:text-grey-4"
          {...maxLengthHandlers<HTMLTextAreaElement>((event) => setContent(event.target.value))}
        />
        <CharCounter length={content.length} max={COMMENT_MAX_LENGTH} />
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
