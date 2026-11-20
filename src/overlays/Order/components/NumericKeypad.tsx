import { KEYPAD_KEYS, type KeypadKey } from './keypad';

interface NumericKeypadProps {
  onPress: (key: KeypadKey) => void;
}

// 주문 화면의 숫자 키패드 (화면설계서 주문, 시안 '주문 숫자 키패드'). 기기 키보드 대신 화면 아래에 둔다
// 흰 바탕, 위 26 띄우고 3칸 × 4줄, 줄 높이 36·줄 사이 16, 칸은 좌우 20 안에서 같은 폭
// 글자는 모두 Heading1 Grey/8 (지우기는 "←")
function NumericKeypad({ onPress }: NumericKeypadProps) {
  return (
    <div
      className="grid grid-cols-3 gap-y-4 bg-white px-5 pt-6.5"
      role="group"
      aria-label="숫자 키패드"
    >
      {KEYPAD_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-label={key === 'delete' ? '지우기' : key}
          className="h-9 rounded-md text-heading1 text-grey-8 active:bg-grey-0"
          // 입력칸의 포커스를 빼앗지 않는다
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => onPress(key)}
        >
          {key === 'delete' ? '←' : key}
        </button>
      ))}
    </div>
  );
}

export default NumericKeypad;
