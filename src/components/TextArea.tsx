import { useId, type ComponentProps } from 'react';
import { cn } from '@/utils/cn';
import CharCounter from './CharCounter';
import FieldMessage from './FieldMessage';

interface TextAreaProps extends Omit<ComponentProps<'textarea'>, 'value'> {
  value: string;
  /** 최대 글자 수. 넘으면 입력이 진행되지 않는다 */
  maxLength: number;
  /** 이 글자 수부터 오른쪽 아래에 `n/최대`를 보여준다 (최대면 붉게) */
  counterFrom: number;
  label?: string;
  error?: string;
}

// 여러 줄 입력 + 글자 수 (종목 소개, 공시 본문, 후기)
function TextArea({
  label,
  error,
  value,
  maxLength,
  counterFrom,
  className,
  id,
  ...props
}: TextAreaProps) {
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
      <div
        className={cn(
          'flex flex-col rounded-lg border border-gray-300 px-3 pt-3 pb-2 focus-within:border-gray-900',
          error && 'border-red-500 focus-within:border-red-500',
        )}
      >
        <textarea
          id={inputId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-h-16 w-full resize-none outline-none"
          {...props}
        />
        <CharCounter length={value.length} max={maxLength} showFrom={counterFrom} />
      </div>
    </div>
  );
}

export default TextArea;
