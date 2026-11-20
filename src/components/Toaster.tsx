import { Link } from 'react-router';
import { useStore } from 'zustand';
import { dismissToast, toastStore, type ToastType } from '@/libs/notify';
import { cn } from '@/utils/cn';
import { AlertCircleIcon, CheckBoxFilledIcon, SpeakerIcon } from './icons';

// 시안 Toast: 성공 CheckBox 24, 오류 Notice 24, 새 거래일 speaker 24 (모두 흰색)
function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return <CheckBoxFilledIcon />;
  if (type === 'error') return <AlertCircleIcon />;
  return <SpeakerIcon />;
}

// notify.success / notify.error로 띄운 알림을 화면 위쪽에 쌓아 보여준다. AppLayout에 한 번만 둔다
// 새 토스트는 아래에 붙고, 위의 토스트가 닫히면 높이를 0으로 줄여 아래 토스트가 위로 미끄러져 올라온다
function Toaster() {
  const toasts = useStore(toastStore, (state) => state.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-0 z-60 flex flex-col items-center px-4 pt-4"
    >
      {toasts.map((toast) => (
        // grid-rows 0fr ↔ 1fr 전환으로 높이를 부드럽게 줄인다 (토스트 사이 간격 pb-2도 같이 줄어듦)
        <div
          key={toast.id}
          className={cn(
            'grid w-full transition-all duration-200',
            toast.isClosing ? 'grid-rows-[0fr] opacity-0' : 'animate-toast-in grid-rows-[1fr]',
          )}
        >
          <div className="flex justify-center overflow-hidden">
            <div className="pb-2">
              <div className="pointer-events-auto flex items-center gap-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white">
                <ToastIcon type={toast.type} />
                {toast.message}
                {toast.link && (
                  <Link
                    to={toast.link.to}
                    className="ml-1 font-bold underline"
                    onClick={() => dismissToast(toast.id, { immediate: true })}
                  >
                    {toast.link.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Toaster;
