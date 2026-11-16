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
      // 로그인 여부 확인에 쓰므로 실패하면 바로 결과를 낸다. 로그인 안 했을 때 다시 시도하면 랜딩 이동만 늦어진다
      retry: false,
    }),
};
