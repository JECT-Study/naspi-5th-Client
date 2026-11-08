import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { getApiErrorCode } from './apiError';
import { isNetworkError, reportNetworkError } from './networkError';
import { notify } from './notify';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** 요청 처리 실패 토스트(공통 5-1)의 작업 이름. '저장' → "저장 중 문제가 발생했어요. …" */
      action?: string;
      /**
       * 화면이 직접 안내하는 서버 에러 코드 (입력칸 아래 문구 등). 이 코드면 공통 토스트를 띄우지 않는다
       * 'all'이면 모든 실패를 화면이 처리한다 (로그인 실패 안내 등)
       */
      handledErrors?: readonly string[] | 'all';
    };
  }
}

const isHandledByScreen = (error: unknown, handledErrors?: readonly string[] | 'all') => {
  if (handledErrors === 'all') return true;
  const code = getApiErrorCode(error);
  return code !== undefined && Boolean(handledErrors?.includes(code));
};

// 에러 알림 규칙을 여기 한 곳에 둔다 (axios 인터셉터는 알림을 띄우지 않음)
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 인터넷 연결 끊김: 네트워크 오류 페이지 (공통 8)
      if (isNetworkError(error)) {
        reportNetworkError();
        return;
      }
      // 처음 불러오기 실패는 화면이 "정보를 불러오지 못했어요."로 보여준다
      // 이미 보고 있던 데이터를 다시 불러오다 실패한 경우만 토스트로 알린다
      if (query.state.data !== undefined) notify.error('정보를 불러오지 못했어요.');
    },
  }),
  mutationCache: new MutationCache({
    // 변경 실패: 화면이 직접 안내하는 에러가 아니면 요청 처리 실패 토스트 (공통 5-1)
    onError: (error, _variables, _context, mutation) => {
      if (isHandledByScreen(error, mutation.meta?.handledErrors)) return;
      notify.requestFailed(mutation.meta?.action ?? '요청 처리');
    },
  }),
  // networkMode 'always': 오프라인이어도 요청을 보내서 바로 실패시킨다
  // 기본값('online')은 오프라인이면 요청을 멈추고 기다려서, 스켈레톤·처리 중 상태가 끝없이 남고 오류 안내가 안 뜬다
  // 실패는 위의 처리로 이어진다: 조회는 네트워크 오류 페이지(공통 8), 변경은 요청 처리 실패 토스트(공통 5-1)
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // 네트워크가 끊긴 실패는 다시 시도해도 같으니 바로 오류 페이지로 간다
      retry: (failureCount, error) => !isNetworkError(error) && failureCount < 1,
      refetchOnWindowFocus: false,
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
    },
  },
});
