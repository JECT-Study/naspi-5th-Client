import { withKstOffset } from '@/utils/date';
import type { Comment, CommentResponse } from './comment.types';

// 서버(댓글) → 화면 모양. 일시는 KST에 시간대를 붙여 둔다 (utils/date withKstOffset)
// 공시·뉴스 상세에 같이 오는 댓글은 disclosure·news 매퍼가 같은 내용으로 바꾼다 (다른 도메인 함수는 가져오지 않는다)

const WITHDRAWN_NAME = '탈퇴한 사용자';

export const toComment = (comment: CommentResponse): Comment => ({
  commentId: comment.commentId,
  authorName: comment.authorName ?? WITHDRAWN_NAME,
  isMine: comment.mine,
  content: comment.content,
  createdAt: withKstOffset(comment.createdAt),
});
