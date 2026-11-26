// API layer type
// 위: 서버 응답 그대로 (Swagger 공시 댓글·뉴스 댓글). 아래: 화면이 쓰는 모양 (comment.mapper가 바꾼다)

import type { StockId } from '@/apis/domains/stock/stock.types';

export type CommentId = number;
/** 댓글이 달리는 콘텐츠 (서비스 정책 3.3: 공시·뉴스 공통) */
export type CommentTargetType = 'DISCLOSURE' | 'NEWS';

/** 댓글 API 실패 코드 (Swagger) */
export const COMMENT_ERROR_CODE = {
  /** 댓글이 비었거나 100자 초과 */
  INVALID_CONTENT: '615',
  /** 진행 중인 리그가 아님 (대기실, 종료) */
  LEAGUE_NOT_ACTIVE: '616',
  /** 댓글이 없거나 이미 삭제됨 */
  NOT_FOUND: '617',
  /** 작성자가 아님 */
  NOT_AUTHOR: '618',
} as const;

// ── 서버 응답 ──

// 댓글 항목 (댓글 목록·공시/뉴스 상세의 comments·목록의 previewComment 모두 같은 모양)
export interface CommentResponse {
  commentId: CommentId;
  content: string;
  authorPlayerId: number;
  /** 탈퇴한 작성자는 "탈퇴한 사용자". 비어 올 때도 대비한다 */
  authorName: string | null;
  mine: boolean;
  createdAt: string;
}

// 댓글 작성 (POST .../comments)
export interface CreateCommentRequest {
  content: string;
}

// ── 화면 모양 ──

/** 댓글이 달린 곳. 서버 주소에 종목이 들어가서(.../stocks/{stockId}/disclosures/{id}/comments) 종목도 같이 둔다 */
export interface CommentTarget {
  type: CommentTargetType;
  stockId: StockId;
  id: number;
}

// 댓글 목록 (오래된 순)
export interface Comment {
  commentId: CommentId;
  /** 탈퇴한 사용자면 '탈퇴한 사용자' */
  authorName: string;
  /** 내 댓글인지 (삭제 가능) */
  isMine: boolean;
  content: string;
  createdAt: string;
}
