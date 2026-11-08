import type { ComponentProps } from 'react';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { getButtonClassName, type ButtonVariant } from './buttonStyles';
import { SpinnerIcon } from './icons';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  /**
   * 요청 중이면 버튼을 막아 같은 요청이 또 가지 않게 한다 (화면설계서 공통: 중복 요청 방지)
   * pendingLabel이 있으면 요청이 0.3초를 넘길 때 스피너와 함께 그 문구로 바꿔 보여준다 ("생성 중...")
   */
  isPending?: boolean;
  pendingLabel?: string;
}

function Button({
  variant = 'primary',
  type = 'button',
  isPending = false,
  pendingLabel,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const showsPendingLabel = useDelayedFlag(isPending && pendingLabel !== undefined);

  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={getButtonClassName(variant, className)}
      {...props}
    >
      {showsPendingLabel ? (
        <span className="flex items-center gap-2">
          <SpinnerIcon className="size-4" />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
