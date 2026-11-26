import { useRef, useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentKeys } from '@/apis/domains/comment/comment.queries';
import { createComment } from '@/apis/domains/comment/comment.service';
import type { Comment, CommentTarget } from '@/apis/domains/comment/comment.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { useAutoHeight } from '@/hooks/useAutoHeight';
import { cn } from '@/utils/cn';
import { countGraphemes } from '@/utils/graphemes';
import { maxLengthHandlers } from '@/utils/maxLength';
import CharCounter from '@/components/ui/CharCounter';
import { SendIcon } from '@/components/ui/icons';

interface CommentInputProps {
  roomId: RoomId;
  target: CommentTarget;
  /** 댓글을 단 뒤 (새 댓글 목록을 받은 다음). 상세의 댓글 수·피드 갱신에 쓴다 */
  onChanged?: (comments: Comment[]) => void;
}

/** 댓글 최대 글자 수 (서비스 정책 3.3) */
const COMMENT_MAX_LENGTH = 100;

// 상세 화면 맨 아래 댓글 입력. 글자 수는 처음부터 (100자면 붉게), 보내면 비운다
function CommentInput({ roomId, target, onChanged }: CommentInputProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: (text: string) => createComment(roomId, target, { content: text }),
    onSuccess: async () => {
      setContent('');
      // 댓글 목록 API로 새 목록을 받아 그린다 (댓글 목록 아래에 새 댓글)
      const listKey = commentKeys.list(roomId, target.type, target.id);
      await queryClient.invalidateQueries({ queryKey: listKey });
      const latest = queryClient.getQueryData<Comment[]>(listKey);
      if (latest) onChanged?.(latest);
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
          입력을 시작하면 아래 32를 비우고 오른쪽 12·아래 6에 글자 수 (시안 TextField 댓글 입력 상태)
          높이는 5줄(100) + 위 14 + 아래(글자 수 있으면 32, 없으면 14)까지만 늘고, 줄바꿈을 더 하면 칸 안에서 스크롤한다 */}
      <div className="relative flex min-w-0 flex-1 items-center">
        <textarea
          ref={ref}
          aria-label="댓글"
          placeholder="댓글을 입력해 주세요."
          rows={1}
          value={content}
          className={cn(
            'block w-full resize-none bg-transparent px-4 pt-3.5 text-title4-5 text-grey-8 outline-none placeholder:text-grey-4',
            content.length > 0 ? 'max-h-36.5 pb-8' : 'max-h-32 pb-3.5',
          )}
          // 글자 수는 보이는 글자 단위 (이모지도 1자, utils/maxLength)
          {...maxLengthHandlers<HTMLTextAreaElement>(COMMENT_MAX_LENGTH, (event) =>
            setContent(event.target.value),
          )}
        />
        <CharCounter
          length={countGraphemes(content)}
          max={COMMENT_MAX_LENGTH}
          className="pointer-events-none absolute right-3 bottom-1.5"
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
