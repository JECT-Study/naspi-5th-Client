import { cn } from '@/utils/cn';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 스위치 왼쪽 문구 */
  label: string;
}

// 문구 + 슬라이딩 스위치 (호가 '자세히 보기'). 다른 화면에서도 쓰게 되면 src/components/로 옮긴다
function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="flex items-center gap-1.5 text-xs text-gray-500"
      onClick={() => onChange(!checked)}
    >
      {label}
      {/* 시안 Icon/Toggle: 36×18 트랙(켜짐 NSBlue, 꺼짐 Grey/4) + 흰 손잡이 14, 안쪽 여백 2 */}
      <span
        aria-hidden="true"
        className={cn(
          'relative h-4.5 w-9 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-ns-blue' : 'bg-grey-4',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white transition-transform duration-200',
            checked && 'translate-x-4.5',
          )}
        />
      </span>
    </button>
  );
}

export default ToggleSwitch;
