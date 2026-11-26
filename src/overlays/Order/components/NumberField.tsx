import { useId, type ReactNode } from 'react';
import FieldMessage from '@/components/ui/FieldMessage';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { applyKeypadKey } from './keypad';

interface NumberFieldProps {
  label: string;
  /** 0이면 비어 있는 것으로 보여준다 */
  value: number;
  onChange: (value: number) => void;
  /** 이 칸을 눌러 키패드 입력 대상으로 고를 때 */
  onActivate: () => void;
  /** 숫자 뒤 단위 (원, 주) */
  unit: string;
  error?: string;
  /** 숫자 아래 안내 (총 금액, 예상 금액) */
  hint?: ReactNode;
  /** 오른쪽 버튼 (가격 +/-) */
  addon?: ReactNode;
}

const MAX_DIGITS = 9;

// 시안 '주문 가격 입력 영역'·'주문 수량 입력 영역': Grey/1 상자(모서리 6, 여백 8) 안 좌우 4
// - 이름 Caption1 Grey/5 → 4 → 숫자 Heading2 Grey/8 (→ 4 → 안내 Body3 Grey/6), 오른쪽에 +/- 버튼
// - 오류: 상자 위(사이 8)에 오류 문구, 숫자가 NSBuy (상자 테두리는 그대로)
// - 키패드가 고치는 칸도 따로 표시하지 않는다 (입력칸 포커스 테두리 없음, 디자이너 확인)
// 숫자만 받고 천 단위 쉼표로 보여준다. 휴대폰에서는 기기 키보드를 띄우지 않고(inputMode none) 화면의 숫자 키패드로 입력한다
function NumberField({
  label,
  value,
  onChange,
  onActivate,
  unit,
  error,
  hint,
  addon,
}: NumberFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    // data-keypad-field: 오류 문구·칸 어디를 눌러도 키패드를 내리지 않는다 (주문 오버레이)
    <div data-keypad-field className="flex flex-col gap-2">
      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
      {/* 칸 어디를 눌러도 키패드 입력 대상이 된다 (focus 이벤트가 오지 않는 환경 대비) */}
      <div
        className="flex items-center justify-between gap-2 rounded-md bg-grey-1 p-2"
        onClick={onActivate}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1 px-1">
          <label htmlFor={inputId} className="text-caption1 text-grey-5">
            {label}
          </label>
          <input
            id={inputId}
            inputMode="none"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'min-w-0 bg-transparent text-heading2 caret-transparent outline-none placeholder:text-grey-4',
              error ? 'text-ns-buy' : 'text-grey-8',
            )}
            placeholder={`0${unit}`}
            value={value > 0 ? `${formatNumber(value)}${unit}` : ''}
            onFocus={onActivate}
            // 웹 키보드의 지우기는 화면 키패드의 지우기와 같게 맨 끝 숫자를 지운다
            // (기본 동작이면 맨 끝의 단위 글자 "원"·"주"가 지워져 숫자가 그대로 남는다). 전체를 선택했으면 모두 지운다
            onKeyDown={(event) => {
              if (event.key !== 'Backspace' && event.key !== 'Delete') return;
              event.preventDefault();
              const { selectionStart, selectionEnd, value: text } = event.currentTarget;
              const isAllSelected = text.length > 0 && selectionStart === 0 && selectionEnd === text.length;
              onChange(isAllSelected ? 0 : applyKeypadKey(value, 'delete'));
            }}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
              onChange(Number(digits));
            }}
          />
          {hint && <p className="text-body3 text-grey-6">{hint}</p>}
        </div>
        {addon && <div className="shrink-0 pr-1">{addon}</div>}
      </div>
    </div>
  );
}

export default NumberField;
