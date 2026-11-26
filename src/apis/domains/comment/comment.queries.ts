import { queryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import { getComments } from './comment.service';
import type { CommentTarget, CommentTargetType } from './comment.types';

export const commentKeys = {
  room: (roomId: RoomId) => ['rooms', roomId, 'comments'] as const,
  list: (roomId: RoomId, targetType: CommentTargetType, targetId: number) =>
    [...commentKeys.room(roomId), targetType, targetId] as const,
};

export const commentQueries = {
  list: (roomId: RoomId, target: CommentTarget) =>
    queryOptions({
      queryKey: commentKeys.list(roomId, target.type, target.id),
      queryFn: () => getComments(roomId, target),
    }),
};
