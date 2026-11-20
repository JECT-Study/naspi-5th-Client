import type { ReactNode } from 'react';
import { ReplyIcon } from '@/components/ui/icons';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/date';

interface CommentRowProps {
  authorName: string;
  createdAt: string;
  content: string;
  /** 오른쪽 끝 메뉴 (내 댓글의 점 3개) */
  menu?: ReactNode;
  /** 본문을 2줄까지만 보여준다 (피드 카드의 댓글 미리보기) */
  isClamped?: boolean;
}

// 댓글 한 줄 (시안 List/comment): 흰색, 높이 72(본문이 길면 늘어남), 여백 12·15, 화살표와 내용 사이 10
// - 화살표: CommentArrow 18 Grey/4, 위 18·아래 10 여백 안 (본문 줄 옆에 오도록)
// - 내용: 이름 | 시간 (Body3 Grey/6, 사이 4, 가운데 세로선 10) → 4 → 본문 Body1 Grey/8
// - 내 댓글이면 오른쪽 끝에 점 3개(ThreadDots 18 Grey/6)
// 피드 카드의 댓글 미리보기, 공시·뉴스 상세의 댓글 목록에서 쓴다
function CommentRow({ authorName, createdAt, content, menu, isClamped = false }: CommentRowProps) {
  return (
    <div className="flex min-h-18 items-center gap-2.5 bg-white px-3.75 py-3">
      <div className="flex shrink-0 pt-4.5 pb-2.5">
        <ReplyIcon className="text-grey-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1 text-body3 text-grey-6">
          <span className="truncate">{authorName}</span>
          <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-grey-6" />
          <span className="shrink-0">{formatRelativeTime(new Date(createdAt))}</span>
        </div>
        <p
          className={cn(
            'text-body1 wrap-break-word whitespace-pre-line text-grey-8',
            isClamped && 'line-clamp-2',
          )}
        >
          {content}
        </p>
      </div>
      {menu}
    </div>
  );
}

export default CommentRow;
