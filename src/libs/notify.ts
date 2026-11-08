import { createStore } from 'zustand/vanilla';

// 토스트 알림. 표시할 목록은 이 파일이 갖고, 화면에 그리는 일은 components/Toaster가 맡는다
// apis/client.ts처럼 React 밖에서도 부를 수 있도록 훅이 아닌 함수로 연다

export type ToastType = 'success' | 'error';

export interface ToastLink {
  label: string;
  to: string;
}

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  /** 토스트 안의 텍스트 링크. 누르면 이동하고 토스트를 바로 닫는다 */
  link?: ToastLink;
  /** 사라지는 중(페이드 아웃)인지 */
  isClosing: boolean;
}

interface ToastOptions {
  link?: ToastLink;
}

// 화면설계서 공통: 2초 표시 후 자동으로 닫힘
const TOAST_DURATION_MS = 2000;
/** 페이드 아웃 시간. Toaster의 transition 시간(duration-200)과 같게 둔다 */
const TOAST_EXIT_MS = 200;
const MAX_TOASTS = 3;

export const toastStore = createStore<{ toasts: Toast[] }>(() => ({ toasts: [] }));

let nextId = 0;

const remove = (id: number) => {
  toastStore.setState((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
};

/** 페이드 아웃한 뒤 지운다. immediate면 바로 지운다 (링크를 눌렀을 때) */
export const dismissToast = (id: number, { immediate = false } = {}) => {
  if (immediate) {
    remove(id);
    return;
  }
  toastStore.setState((state) => ({
    toasts: state.toasts.map((toast) => (toast.id === id ? { ...toast, isClosing: true } : toast)),
  }));
  setTimeout(() => remove(id), TOAST_EXIT_MS);
};

const show = (type: ToastType, message: string, options: ToastOptions = {}) => {
  const visible = toastStore.getState().toasts.filter((toast) => !toast.isClosing);
  // 같은 메시지가 이미 떠 있으면 다시 띄우지 않는다 (요청 여러 개가 한꺼번에 실패할 때 등)
  if (visible.some((toast) => toast.message === message)) return;
  // 최대 개수를 넘으면 가장 오래된 것부터 닫는다
  if (visible.length >= MAX_TOASTS) dismissToast(visible[0].id);

  const id = ++nextId;
  toastStore.setState((state) => ({
    toasts: [...state.toasts, { id, type, message, link: options.link, isClosing: false }],
  }));
  setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
};

export const notify = {
  error: (message: string, options?: ToastOptions) => show('error', message, options),
  success: (message: string, options?: ToastOptions) => show('success', message, options),
  /** 요청 처리 실패 (화면설계서 공통 5-1). action은 '저장', '전송', '탈퇴' 등 */
  requestFailed: (action: string) =>
    show('error', `${action} 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.`),
};
