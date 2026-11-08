// API layer type
// API 스펙 확정 전 화면설계서·서비스 정책 기준으로 정의. 확정되면 필드명과 구조를 맞춘다

export type CommentId = number;
/** 댓글이 달리는 콘텐츠 (서비스 정책 3.3: 공시·뉴스 공통) */
export type CommentTargetType = 'DISCLOSURE' | 'NEWS';

// 댓글 목록 조회 (오래된 순)
export interface Comment {
  commentId: CommentId;
  /** 탈퇴한 사용자면 '탈퇴한 사용자' */
  authorName: string;
  /** 내 댓글인지 (삭제 가능) */
  isMine: boolean;
  content: string;
  createdAt: string;
}

// 댓글 작성
export interface CreateCommentRequest {
  content: string;
}
