import type { ReactElement } from 'react';
import { toast } from 'sonner';

// 토스트 알림 (sonner). 무엇을 띄울지는 이 파일이, 어떻게 그릴지는 components/Toaster가 정한다
// apis/client.ts·libs/queryClient처럼 React 밖에서도 부를 수 있도록 훅이 아닌 함수로 연다
// libs는 화면 컴포넌트를 불러올 수 없어서(의존 규칙), 그리는 함수를 Toaster에게서 넘겨받는다 (setToastRenderer)

/** 종류마다 앞의 아이콘이 다르다 (시안: 성공 체크박스, 오류 느낌표, 알림 확성기) */
export type ToastType = 'success' | 'error' | 'announce';

export interface ToastLink {
  label: string;
  to: string;
}

export interface ToastContent {
  type: ToastType;
  message: string;
  /** 토스트 안의 텍스트 링크. 누르면 이동하고 토스트를 바로 닫는다 */
  link?: ToastLink;
}

interface ToastOptions {
  link?: ToastLink;
}

/** 토스트 한 개를 그린다. close를 부르면 그 토스트를 닫는다 */
export type ToastRenderer = (content: ToastContent, close: () => void) => ReactElement;

let renderToast: ToastRenderer | null = null;

/** 토스트 모양을 등록한다. components/Toaster가 불러올 때 한 번 등록한다 */
export const setToastRenderer = (renderer: ToastRenderer) => {
  renderToast = renderer;
};

const show = (type: ToastType, message: string, options: ToastOptions = {}) => {
  const render = renderToast;
  if (!render) return;
  // 같은 문구가 이미 떠 있으면 다시 띄우지 않는다 (요청 여러 개가 한꺼번에 실패할 때 등). 문구를 id로 쓴다
  if (toast.getToasts().some((shown) => shown.id === message)) return;
  toast.custom((id) => render({ type, message, link: options.link }, () => toast.dismiss(id)), {
    id: message,
  });
};

export const notify = {
  error: (message: string, options?: ToastOptions) => show('error', message, options),
  success: (message: string, options?: ToastOptions) => show('success', message, options),
  /** 성공·실패가 아닌 알림 (새 거래일 시작) */
  announce: (message: string, options?: ToastOptions) => show('announce', message, options),
  /** 요청 처리 실패 (화면설계서 공통 5-1). action은 '저장', '전송', '탈퇴' 등 */
  requestFailed: (action: string) =>
    show('error', `${action} 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.`),
};
