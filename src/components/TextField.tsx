import { useId, type ComponentProps } from 'react';
import { useMaxLengthInput } from '@/hooks/useMaxLengthInput';
import { cn } from '@/utils/cn';
import FieldMessage from './FieldMessage';

// input의 size(글자 칸 수) 속성은 쓰지 않고, 같은 이름을 입력칸 크기로 쓴다
interface TextFieldProps extends Omit<ComponentProps<'input'>, 'size'> {
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
// - 오류가 있으면 NSBuy 테두리, 입력 중이면 NSBlue 테두리
// - 라벨(Body2 Grey/8)·오류 문구·입력칸 사이 간격 4
// maxLength를 넘는 한글(조합 중인 글자)은 조합이 끝나면 잘라 낸다 (hooks/useMaxLengthInput)
const SIZE_CLASS = {
  md: 'h-8.5 px-2 py-1.5 text-body2 text-grey-8 placeholder:font-normal',
  sm: 'h-5.5 px-2 py-0.5 text-body3 text-grey-7',
} as const;

function TextField({
  label,
  error,
  size = 'md',
  className,
  id,
  maxLength,
  onChange,
  onCompositionEnd,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  // 글자 수 표시가 없는 칸이라, 최대를 넘겨 입력하려 해도 막기만 하고 붉게 표시하지 않는다 (isOverLimit은 쓰지 않음)
  // 디자이너 확정 규칙은 글자 수 표시가 있는 칸(종목 소개·공시·댓글)만. 없는 칸은 디자이너가 정해서 알려 주기로 함 (11/19 스레드)
  const { ref, handlers } = useMaxLengthInput<HTMLInputElement>({
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
      <input
        ref={ref}
        id={inputId}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'w-full rounded-md border border-grey-3 bg-white outline-none placeholder:text-grey-4 focus:border-ns-blue',
          SIZE_CLASS[size],
          error && 'border-ns-buy focus:border-ns-buy',
        )}
        {...props}
        {...handlers}
      />
    </div>
  );
}

export default TextField;
