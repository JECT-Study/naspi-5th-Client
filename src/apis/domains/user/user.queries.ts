import { queryOptions } from '@tanstack/react-query';
import { getMe } from './user.service';

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

export const userQueries = {
  me: () =>
    queryOptions({
      queryKey: userKeys.me(),
      queryFn: getMe,
    }),
};
