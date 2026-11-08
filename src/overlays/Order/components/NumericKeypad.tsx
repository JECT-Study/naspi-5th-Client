import { cn } from '@/utils/cn';
import { KEYPAD_KEYS, type KeypadKey } from './keypad';

interface NumericKeypadProps {
  onPress: (key: KeypadKey) => void;
}

// 주문 화면의 숫자 키패드 (화면설계서 주문). 기기 키보드 대신 항상 화면 아래에 둔다
// TODO: 디자인이 나오면 키 모양을 바꾼다
function NumericKeypad({ onPress }: NumericKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-1" role="group" aria-label="숫자 키패드">
      {KEYPAD_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-label={key === 'delete' ? '지우기' : key}
          className={cn(
            'h-12 rounded-lg text-xl font-bold active:bg-gray-100',
            key === 'delete' && 'text-base text-gray-500',
          )}
          // 입력칸의 포커스를 빼앗지 않는다
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => onPress(key)}
        >
          {key === 'delete' ? '⌫' : key}
        </button>
      ))}
    </div>
  );
}

export default NumericKeypad;
