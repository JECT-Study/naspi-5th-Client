import { useId, type ComponentProps } from 'react';
import { cn } from '@/utils/cn';
import { isAtMaxLength, maxLengthHandlers } from '@/utils/maxLength';
import CharCounter from './CharCounter';
import FieldMessage from './FieldMessage';

interface TextAreaProps extends Omit<ComponentProps<'textarea'>, 'value'> {
  value: string;
  /** 최대 글자 수. 넘으면 입력이 진행되지 않는다 */
  maxLength: number;
  label?: string;
  error?: string;
}

// 시안 DescriptionInput (종목 소개: 새 리그의 방장 상장, 종목 상장, 종목 정보)
// 크기 고정 312(FILL)×80 (50자 기준 최대 높이, 디자이너 코멘트). 여백 6·8, 아래 32는 글자 수 자리
// 모서리 6, 흰색 + Grey/3 테두리, 입력값 Body2.5 Grey/8, 안내 문구 Grey/4
// 글자 수는 처음부터 오른쪽 아래에 (오른쪽 12·아래 6). 최대에 닿거나 오류가 있으면 NSBuy 테두리
// 입력 중에도 테두리는 그대로 (포커스 표시 없음, 디자이너 확인)
// maxLength를 넘는 한글(조합 중인 글자)은 조합이 끝나면 잘라 낸다 (utils/maxLength)
function TextArea({
  label,
  error,
  value,
  maxLength,
  className,
  id,
  onChange,
  onCompositionEnd,
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-body2 text-grey-8">
          {label}
        </label>
      )}
      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
      <div className="relative">
        <textarea
          id={inputId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'block h-20 w-full resize-none rounded-md border bg-white px-2 pt-1.5 pb-8 text-body2-5 text-grey-8 outline-none placeholder:text-grey-4',
            error || isAtMaxLength(value.length, maxLength) ? 'border-ns-buy' : 'border-grey-3',
          )}
          {...props}
          {...maxLengthHandlers(onChange, onCompositionEnd)}
        />
        <CharCounter
          length={value.length}
          max={maxLength}
          className="pointer-events-none absolute right-3 bottom-1.5"
        />
      </div>
    </div>
  );
}

export default TextArea;
