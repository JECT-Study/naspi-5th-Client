import { createContext } from 'react';

/**
 * 세션이 만료돼도 보여 줄 모달인지 (로그인 모달과 그 안의 이름 입력 모달)
 * 화면설계서 공통 화면 정책: 모달은 한 번에 하나라서, 재로그인 모달(공통 2-2)이 뜨면 다른 모달은 숨긴다
 */
export const KeepOnSessionExpiredContext = createContext(false);
