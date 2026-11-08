import { useId, type ReactNode } from 'react';
import FieldMessage from '@/components/FieldMessage';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';

interface NumberFieldProps {
  label: string;
  /** 0이면 비어 있는 것으로 보여준다 */
  value: number;
  onChange: (value: number) => void;
  /** 숫자 키패드가 지금 이 칸을 고치는지 */
  isActive: boolean;
  /** 이 칸을 눌러 키패드 입력 대상으로 고를 때 */
  onActivate: () => void;
  /** 숫자 뒤 단위 (원, 주) */
  unit: string;
  error?: string;
  /** 입력창 오른쪽 아래 안내 (예상 금액 등) */
  hint?: ReactNode;
  /** 오른쪽 버튼 (가격 +/-) */
  addon?: ReactNode;
}

const MAX_DIGITS = 9;

// 큰 숫자 입력 (1주 희망 가격, 수량). 숫자만 받고 천 단위 쉼표로 보여준다
// 휴대폰에서는 기기 키보드를 띄우지 않고(inputMode none) 화면의 숫자 키패드로 입력한다. PC 키보드 입력은 그대로 된다
function NumberField({
  label,
  value,
  onChange,
  isActive,
  onActivate,
  unit,
  error,
  hint,
  addon,
}: NumberFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    // data-keypad-field: 라벨·칸·안내 어디를 눌러도 키패드를 내리지 않는다 (주문 오버레이)
    <div data-keypad-field className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs text-gray-500">
        {label}
      </label>
      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
      {/* 칸 어디를 눌러도 키패드 입력 대상이 된다 (focus 이벤트가 오지 않는 환경 대비) */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-3',
          isActive && 'border-gray-900',
          error && 'border-red-500',
        )}
        onClick={onActivate}
      >
        <input
          id={inputId}
          inputMode="none"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 text-xl font-bold caret-transparent outline-none"
          placeholder={`0${unit}`}
          value={value > 0 ? `${formatNumber(value)}${unit}` : ''}
          onFocus={onActivate}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
            onChange(Number(digits));
          }}
        />
        {addon}
      </div>
      {hint && <div className="self-end text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

export default NumberField;
