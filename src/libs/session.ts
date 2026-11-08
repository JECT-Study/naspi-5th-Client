import { createStore } from 'zustand/vanilla';

// 로그인 세션 만료 (화면설계서 공통 2-2 재로그인 안내 모달)
// apis/client.ts가 401을 받으면 알리고, AppLayout이 랜딩이 아닌 화면에서 재로그인 모달을 띄운다

export const sessionStore = createStore<{ isExpired: boolean }>(() => ({ isExpired: false }));

export const reportSessionExpired = () => sessionStore.setState({ isExpired: true });

export const clearSessionExpired = () => sessionStore.setState({ isExpired: false });
