import { apiClient, unwrap } from '@/apis/client';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { ApiResponse } from '@/apis/types';
import { toComment } from './comment.mapper';
import type {
  Comment,
  CommentId,
  CommentResponse,
  CommentTarget,
  CreateCommentRequest,
} from './comment.types';

// 공시 댓글·뉴스 댓글 API (주소만 다르고 모양은 같다)
// .../stocks/{stockId}/disclosures/{disclosureId}/comments, .../stocks/{stockId}/news/{newsId}/comments
const commentsPath = (roomId: RoomId, { type, stockId, id }: CommentTarget) =>
  `/api/leagues/${roomId}/stocks/${stockId}/${type === 'DISCLOSURE' ? 'disclosures' : 'news'}/${id}/comments`;

/** 댓글 전체 (오래된 순, 페이징 없음). 상세에도 같은 목록이 오고, 작성·삭제 뒤 다시 불러올 때 쓴다 */
export const getComments = (roomId: RoomId, target: CommentTarget): Promise<Comment[]> =>
  apiClient
    .get<ApiResponse<CommentResponse[]>>(commentsPath(roomId, target))
    .then(unwrap)
    .then((comments) => comments.map(toComment));

/** 실패: 615 비었거나 100자 초과, 616 진행 중인 리그 아님, 607 공시 없음, 610 뉴스 없음 */
export const createComment = async (
  roomId: RoomId,
  target: CommentTarget,
  request: CreateCommentRequest,
): Promise<void> => {
  await apiClient.post(commentsPath(roomId, target), request);
};

/** 실패: 617 댓글 없음, 618 작성자 아님 */
export const deleteComment = async (
  roomId: RoomId,
  target: CommentTarget,
  commentId: CommentId,
): Promise<void> => {
  await apiClient.post(`${commentsPath(roomId, target)}/${commentId}/delete`);
};
