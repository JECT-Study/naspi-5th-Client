import { useId, type ChangeEvent, type ComponentProps, type CompositionEvent } from 'react';
import { cn } from '@/utils/cn';
import { stripEmoji } from '@/utils/emoji';
import { countGraphemes } from '@/utils/graphemes';
import { stripAllSpaces, stripLeadingSpace } from '@/utils/leadingSpace';
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
  /** 이모지 입력 막기 (설계서 v1.9: 이름·리그 이름·종목 이름) */
  blockEmoji?: boolean;
  /** 공백 입력 막기. 없으면 맨 앞 공백만 막는다 (설계서 v1.9: 이름은 공백 사용 불가) */
  blockSpace?: boolean;
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
// 글자 수는 보이는 글자 단위로 세고(이모지도 1자), 넘친 글자는 직접 잘라 낸다 (utils/maxLength, 브라우저 maxLength 속성은 안 씀)
// 맨 앞 공백은 들어가지 않는다. blockSpace면 공백이 아예 들어가지 않는다 (utils/leadingSpace)
// (이름·리그 이름·종목 이름 모두 앞뒤 공백 없는 값을 쓴다. 뒤 공백은 치는 도중이라 막지 않고 보낼 때 다듬는다)
// blockEmoji면 이모지도 들어가지 않는다. 치든 붙이든 이모지만 빠지고 나머지 글자는 들어간다 (utils/emoji)
// 앞 공백·이모지를 먼저 지운 뒤 글자 수를 센다 → 붙여넣기도 지울 글자를 빼고 최대 글자 수만큼 채워진다
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
  blockEmoji = false,
  blockSpace = false,
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

  // 막는 글자를 지운다. 이모지를 먼저 지워야 이모지 뒤에 있던 공백이 맨 앞으로 와도 같이 지워진다
  const stripBlocked = (input: HTMLInputElement): boolean => {
    const emojiRemoved = blockEmoji && stripEmoji(input);
    const spaceRemoved = blockSpace ? stripAllSpaces(input) : stripLeadingSpace(input);
    return emojiRemoved || spaceRemoved;
  };

  // 조합 중에 이모지가 들어온 경우(키보드에 따라 조합을 끝내지 않고 넣는다) 조합이 끝날 때 지운다
  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    onCompositionEnd?.(event);
    if (stripBlocked(event.currentTarget)) {
      // 받는 쪽은 event.target.value만 읽으므로 같은 입력칸의 이벤트를 그대로 넘긴다 (utils/maxLength와 같은 방식)
      onChange?.(event as unknown as ChangeEvent<HTMLInputElement>);
    }
  };

  // 최대 글자 수가 있으면 넘친 글자를 잘라 낸 뒤 onChange를 부른다
  const limited =
    maxLength === undefined
      ? { onChange, onCompositionEnd: handleCompositionEnd }
      : maxLengthHandlers(maxLength, onChange, handleCompositionEnd);

  // 앞 공백·이모지를 지운 뒤 글자 수를 센다. 한글 조합 중에는 건드리지 않는다 (조합 중인 글자를 바꾸면 글자가 겹친다)
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { nativeEvent } = event;
    if (!(nativeEvent instanceof InputEvent && nativeEvent.isComposing)) {
      stripBlocked(event.currentTarget);
    }
    limited.onChange?.(event);
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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent outline-none placeholder:text-grey-4',
            INPUT_SIZE_CLASS[size],
          )}
          {...props}
          onChange={handleChange}
          onCompositionEnd={limited.onCompositionEnd}
        />
        {/* 작은 칸(sm, 본문 16)은 글자 수 줄 높이를 16으로 줄여 넣는다 */}
        {maxLength !== undefined && (
          <CharCounter
            length={countGraphemes(value)}
            max={maxLength}
            className={size === 'sm' ? 'leading-4' : undefined}
          />
        )}
      </div>
    </div>
  );
}

export default TextField;
