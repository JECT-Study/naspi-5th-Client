import { useId, type ComponentProps } from 'react';
import { cn } from '@/utils/cn';
import FieldMessage from './FieldMessage';

interface TextFieldProps extends ComponentProps<'input'> {
  /** 입력창 위 라벨 */
  label?: string;
  /** 입력창 바로 위에 보여줄 에러 메시지 (화면설계서 배치) */
  error?: string;
}

function TextField({ label, error, className, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-bold">
          {label}
        </label>
      )}
      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-12 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900',
          error && 'border-red-500 focus:border-red-500',
        )}
        {...props}
      />
    </div>
  );
}

export default TextField;
