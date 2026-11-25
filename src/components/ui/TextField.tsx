import { useId, type ChangeEvent, type ComponentProps } from 'react';
import { cn } from '@/utils/cn';
import { pasteWithoutLeadingSpace, stripLeadingSpace } from '@/utils/leadingSpace';
import { maxLengthHandlers } from '@/utils/maxLength';
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
  /** 글자 수의 오른쪽 간격 (바깥 테두리부터). 시안이 칸마다 다르다: 기본 12, 모달 10, 드로어 8 */
  counterInset?: CounterInset;
}

type CounterInset = 8 | 10 | 12;

// 시안 Input/Body
// - md: 높이 34, 여백 6·8, 모서리 6, 흰색 + Grey/3 테두리. 입력값 Body2 Grey/8, 안내 문구 Body2.5 Grey/4
// - sm: 높이 22, 여백 2·8, 입력값 Body3 Grey/7 (드로어 내 계정 이름 수정)
// - 입력 중(포커스)이면 Grey/8 테두리, 오류가 있으면 NSBuy 테두리
// - 최대 글자 수가 있으면 입력을 시작할 때부터 칸 안 오른쪽 12에 글자 수 (세로 가운데, Grey/5. 최대에 닿아도 색 그대로)
// - 라벨(Body2 Grey/8)·오류 문구·입력칸 사이 간격 4
// 테두리·여백은 입력값과 글자 수를 함께 담는 상자에 준다
// (시안 글자 수는 바깥 테두리에서 오른쪽 12·10·8, 세로 가운데 → 테두리 1을 뺀 만큼 오른쪽 여백)
// maxLength를 넘는 한글(조합 중인 글자)은 조합이 끝나면 잘라 낸다 (utils/maxLength)
// 맨 앞 공백은 들어가지 않는다. 붙여넣기도 앞 공백을 걷은 뒤 최대 글자 수만큼 채운다 (utils/leadingSpace)
// (이름·리그 이름·종목 이름 모두 앞뒤 공백 없는 값을 쓴다. 뒤 공백은 치는 도중이라 막지 않고 보낼 때 다듬는다)
const BOX_SIZE_CLASS = {
  md: 'h-8.5 py-1.5 pl-2',
  sm: 'h-5.5 py-0.5 pl-2',
} as const;

// 글자 수 오른쪽 간격 = 테두리 1 + 오른쪽 여백
const COUNTER_INSET_CLASS: Record<CounterInset, string> = {
  12: 'pr-2.75',
  10: 'pr-2.25',
  8: 'pr-1.75',
};

const INPUT_SIZE_CLASS = {
  md: 'text-body2 text-grey-8 placeholder:font-normal',
  sm: 'text-body3 text-grey-7',
} as const;

function TextField({
  label,
  error,
  size = 'md',
  counterInset = 12,
  className,
  id,
  value,
  maxLength,
  onChange,
  onCompositionEnd,
  onPaste,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  // 한글 조합 중이 아닐 때만 앞 공백을 지운다 (조합 중인 글자는 건드리지 않는다)
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { nativeEvent } = event;
    if (!(nativeEvent instanceof InputEvent && nativeEvent.isComposing)) {
      stripLeadingSpace(event.currentTarget);
    }
    onChange?.(event);
  };

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
          'flex items-center gap-2.5 rounded-md border bg-white',
          BOX_SIZE_CLASS[size],
          COUNTER_INSET_CLASS[counterInset],
          error ? 'border-ns-buy' : 'border-grey-3 focus-within:border-grey-8',
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
          onPaste={(event) => {
            onPaste?.(event);
            if (!event.defaultPrevented) pasteWithoutLeadingSpace(event);
          }}
          {...maxLengthHandlers(handleChange, onCompositionEnd)}
        />
        {/* 작은 칸(sm, 본문 16)은 글자 수 줄 높이를 16으로 줄여 넣는다 */}
        {maxLength !== undefined && (
          <CharCounter
            length={value.length}
            max={maxLength}
            className={size === 'sm' ? 'leading-4' : undefined}
          />
        )}
      </div>
    </div>
  );
}

export default TextField;
