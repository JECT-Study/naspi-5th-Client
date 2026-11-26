// 토스트 알림. 무엇을 띄울지는 이 파일이, 어떻게 그릴지는 layouts/App/components/Toaster가 정한다
// apis/client.ts·libs/queryClient처럼 React 밖에서도 부를 수 있도록 훅이 아닌 함수로 연다
// 띄운 토스트 목록을 여기서 들고 있고, Toaster가 구독해서 그린다 (useSyncExternalStore)

/** 종류마다 앞의 아이콘이 다르다 (시안: 성공 체크박스, 오류 느낌표, 알림 확성기) */
export type ToastType = 'success' | 'error' | 'announce';

export interface ToastLink {
  label: string;
  to: string;
}

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  /** 토스트 안의 텍스트 링크. 누르면 이동하고 토스트를 바로 닫는다 */
  link?: ToastLink;
  /** 닫히는 중 (사라지는 애니메이션이 끝나면 목록에서 빠진다) */
  isLeaving: boolean;
}

interface ToastOptions {
  link?: ToastLink;
}

/** 닫히는 애니메이션 시간. Toaster의 transition 시간과 같다 */
export const TOAST_EXIT_MS = 200;

// 먼저 띄운 것이 앞. 새 토스트는 뒤에 붙어 화면에서 기존 토스트 아래에 놓인다 (설계서 토스트 공통 인터랙션)
let toasts: readonly ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const setToasts = (next: readonly ToastItem[]) => {
  toasts = next;
  listeners.forEach((listener) => listener());
};

/** Toaster가 구독하는 토스트 목록 */
export const toastStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => toasts,
  /** 닫기 시작한다. 사라지는 애니메이션이 끝나면 목록에서 뺀다 */
  dismiss: (id: number) => {
    if (!toasts.some((toast) => toast.id === id && !toast.isLeaving)) return;
    setToasts(toasts.map((toast) => (toast.id === id ? { ...toast, isLeaving: true } : toast)));
    setTimeout(() => setToasts(toasts.filter((toast) => toast.id !== id)), TOAST_EXIT_MS);
  },
};

const show = (type: ToastType, message: string, options: ToastOptions = {}) => {
  // 같은 문구가 이미 떠 있으면 다시 띄우지 않는다 (요청 여러 개가 한꺼번에 실패할 때 등)
  if (toasts.some((toast) => toast.message === message && !toast.isLeaving)) return;
  setToasts([...toasts, { id: nextId++, type, message, link: options.link, isLeaving: false }]);
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
