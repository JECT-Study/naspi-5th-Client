import { useId, type ComponentProps } from 'react';
import { cn } from '@/utils/cn';
import { isAtMaxLength, maxLengthHandlers } from '@/utils/maxLength';
import CharCounter from './CharCounter';
import FieldMessage from './FieldMessage';

// input의 size(글자 칸 수) 속성은 쓰지 않고, 같은 이름을 입력칸 크기로 쓴다
interface TextFieldProps extends Omit<ComponentProps<'input'>, 'size' | 'value'> {
  value: string;
  /** 입력창 위 라벨 */
  label?: string;
  /** 라벨과 입력창 사이에 보여줄 에러 메시지 (화면설계서·시안 배치) */
  error?: string;
  /** md: 기본 입력칸 (높이 34) / sm: 드로어 이름 수정 (높이 22) */
  size?: 'md' | 'sm';
}

// 시안 Input/Body
// - md: 높이 34, 여백 6·8, 모서리 6, 흰색 + Grey/3 테두리. 입력값 Body2 Grey/8, 안내 문구 Body2.5 Grey/4
// - sm: 높이 22, 여백 2·8, 입력값 Body3 Grey/7 (드로어 내 계정 이름 수정)
// - 입력 중에도 테두리는 그대로 (포커스 표시 없음, 디자이너 확인)
// - 최대 글자 수가 있으면 칸 안 오른쪽에 글자 수를 처음부터 보여 주고, 최대에 닿거나 오류가 있으면 NSBuy 테두리
// - 라벨(Body2 Grey/8)·오류 문구·입력칸 사이 간격 4
// 테두리·여백은 입력값과 글자 수를 함께 담는 상자에 준다
// maxLength를 넘는 한글(조합 중인 글자)은 조합이 끝나면 잘라 낸다 (utils/maxLength)
const BOX_SIZE_CLASS = {
  md: 'h-8.5 px-2 py-1.5',
  sm: 'h-5.5 px-2 py-0.5',
} as const;

const INPUT_SIZE_CLASS = {
  md: 'text-body2 text-grey-8 placeholder:font-normal',
  sm: 'text-body3 text-grey-7',
} as const;

function TextField({
  label,
  error,
  size = 'md',
  className,
  id,
  value,
  maxLength,
  onChange,
  onCompositionEnd,
  ...props
}: TextFieldProps) {
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
      <div
        className={cn(
          'flex items-center gap-1 rounded-md border bg-white',
          BOX_SIZE_CLASS[size],
          error || isAtMaxLength(value.length, maxLength) ? 'border-ns-buy' : 'border-grey-3',
        )}
      >
        <input
          id={inputId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent outline-none placeholder:text-grey-4',
            INPUT_SIZE_CLASS[size],
          )}
          {...props}
          {...maxLengthHandlers(onChange, onCompositionEnd)}
        />
        {/* 작은 칸(본문 16)에도 들어가게 줄 높이를 16으로 */}
        {maxLength !== undefined && (
          <CharCounter length={value.length} max={maxLength} className="leading-4" />
        )}
      </div>
    </div>
  );
}

export default TextField;
