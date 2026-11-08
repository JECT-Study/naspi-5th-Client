import type { RoomId } from '@/apis/domains/room/room.types';
import { mockContentServer } from '@/mocks/content.mock';
import { delay } from '@/mocks/delay';
import type { Comment, CommentId, CommentTargetType, CreateCommentRequest } from './comment.types';

// TODO: API가 준비되면 각 함수 안쪽을 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)

export const getComments = async (
  _roomId: RoomId,
  targetType: CommentTargetType,
  targetId: number,
): Promise<Comment[]> => {
  await delay(300);
  return mockContentServer.getComments(targetType, targetId);
};

export const createComment = async (
  _roomId: RoomId,
  targetType: CommentTargetType,
  targetId: number,
  request: CreateCommentRequest,
): Promise<void> => {
  await delay(300);
  mockContentServer.addComment(targetType, targetId, request.content);
};

export const deleteComment = async (_roomId: RoomId, commentId: CommentId): Promise<void> => {
  await delay(300);
  mockContentServer.deleteComment(commentId);
};
