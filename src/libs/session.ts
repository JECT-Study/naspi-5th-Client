import { createStore } from 'zustand/vanilla';

// 로그인 세션 만료 (화면설계서 공통 2-2 재로그인 안내 모달)
// apis/client.ts가 401(003·103)을 받으면 알리고, AppLayout이 랜딩으로 보내 재로그인 모달을 띄운다

export const sessionStore = createStore<{ isExpired: boolean }>(() => ({ isExpired: false }));

export const reportSessionExpired = () => sessionStore.setState({ isExpired: true });

/** 만료를 처리(랜딩으로 이동)한 뒤 되돌린다. 다음 만료도 다시 알아챌 수 있게 */
export const clearSessionExpired = () => sessionStore.setState({ isExpired: false });
