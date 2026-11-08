import axios, { AxiosError } from 'axios';
import { createStore } from 'zustand/vanilla';

// 인터넷 연결 끊김으로 조회에 실패했는지 (화면설계서 공통 8 [네트워크 오류] 페이지)
// queryClient의 QueryCache가 알려 주고, AppLayout이 네트워크 오류 페이지를 띄운다

export const networkErrorStore = createStore<{ hasNetworkError: boolean }>(() => ({
  hasNetworkError: false,
}));

/** 서버 응답 없이 연결 단계에서 실패한 요청인지. 타임아웃은 요청 처리 실패(공통 5-1)로 본다 */
export const isNetworkError = (error: unknown): boolean =>
  !navigator.onLine || (axios.isAxiosError(error) && error.code === AxiosError.ERR_NETWORK);

export const reportNetworkError = () => networkErrorStore.setState({ hasNetworkError: true });

export const clearNetworkError = () => networkErrorStore.setState({ hasNetworkError: false });
