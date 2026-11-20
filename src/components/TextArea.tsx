import { useId, type ComponentProps } from 'react';
import { useMaxLengthInput } from '@/hooks/useMaxLengthInput';
import { cn } from '@/utils/cn';
import CharCounter from './CharCounter';
import FieldMessage from './FieldMessage';

interface TextAreaProps extends Omit<ComponentProps<'textarea'>, 'value'> {
  value: string;
  /** 최대 글자 수. 넘으면 입력이 진행되지 않는다 */
  maxLength: number;
  /** 이 글자 수부터 오른쪽 아래에 "(n/최대)"를 보여준다 */
  counterFrom: number;
  label?: string;
  error?: string;
}

// 시안 DescriptionInput (종목 소개: 새 리그의 방장 상장, 종목 상장, 종목 정보)
// 크기 고정 312(FILL)×80 (50자 기준 최대 높이, 디자이너 코멘트). 여백 6·8, 아래 32는 글자 수 자리
// 모서리 6, 흰색 + Grey/3 테두리, 입력값 Body2.5 Grey/8, 안내 문구 Grey/4
// 오류가 있거나 최대를 넘겨 입력하려 하면 NSBuy 테두리 + 붉은 글자 수, 입력 중이면 NSBlue 테두리
// maxLength를 넘는 한글(조합 중인 글자)은 조합이 끝나면 잘라 낸다 (hooks/useMaxLengthInput)
function TextArea({
  label,
  error,
  value,
  maxLength,
  counterFrom,
  className,
  id,
  onChange,
  onCompositionEnd,
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const { ref, isOverLimit, handlers } = useMaxLengthInput<HTMLTextAreaElement>({
    maxLength,
    onChange,
    onCompositionEnd,
  });

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
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'block h-20 w-full resize-none rounded-md border border-grey-3 bg-white px-2 pt-1.5 pb-8 text-body2-5 text-grey-8 outline-none placeholder:text-grey-4 focus:border-ns-blue',
            (error || isOverLimit) && 'border-ns-buy focus:border-ns-buy',
          )}
          {...props}
          {...handlers}
        />
        <CharCounter
          length={value.length}
          max={maxLength}
          showFrom={counterFrom}
          isOverLimit={isOverLimit}
        />
      </div>
    </div>
  );
}

export default TextArea;
