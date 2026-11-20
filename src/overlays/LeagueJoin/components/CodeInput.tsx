import { useEffect, useRef, useState } from 'react';
import { INVITE_CODE_LENGTH, normalizeInviteCode } from '@/apis/domains/room/room.validation';
import { cn } from '@/utils/cn';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

// 초대 코드 7칸 (영문·숫자 섞인 7자). 보이지 않는 입력창 하나를 칸 위에 겹쳐서 붙여넣기·지우기를 그대로 쓴다
// 확인 중에는 막았다가(disabled), 끝나면 다시 입력할 수 있게 포커스를 돌려준다
function CodeInput({ value, onChange, disabled = false, hasError = false }: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  // 한글 자판으로 조합 중인 입력값 (조합 중이 아니면 null)
  // 조합 도중에 입력창 값을 영문으로 바꿔 넣으면 브라우저가 조합 중인 글자를 다시 넣어 글자가 겹친다 ("마" → AAKAK)
  // 그래서 조합이 끝날 때까지는 입력창에 그대로 두고, 칸에만 영문으로 바꿔 보여 준다
  const [composingValue, setComposingValue] = useState<string | null>(null);
  const shownCode = composingValue === null ? value : normalizeInviteCode(composingValue);

  const commit = (raw: string) => {
    setComposingValue(null);
    onChange(normalizeInviteCode(raw));
  };

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={composingValue ?? value}
        disabled={disabled}
        autoFocus
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        aria-label={`초대 코드 ${INVITE_CODE_LENGTH}자리`}
        className="absolute inset-0 z-10 cursor-text opacity-0"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => {
          if (event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing) {
            setComposingValue(event.target.value);
          } else {
            commit(event.target.value);
          }
        }}
        onCompositionEnd={(event) => commit(event.currentTarget.value)}
      />
      {/* 시안 Invitation Code Input: 높이 48 칸 7개, 사이 10 (360 화면의 312 폭에서 칸 폭 36)
          화면이 넓어지면 사이는 10 그대로 두고 칸 폭이 같이 늘어난다 (컨테이너는 화면 폭 따라 늘어나는 시안 규칙)
          칸은 모서리 6, 흰색 + Grey/3 테두리, 글자 Heading2 Grey/8
          입력 중에는 다음에 입력할 칸이 NSBlue (다 채우면 마지막 칸), 오류면 모든 칸이 NSBuy
          화면설계서 코드로 참여 1 "입력 완료 시 다음 칸으로 포커스 이동" (시안은 첫 칸이 파란 예시 한 장뿐) */}
      <div className="flex gap-2.5" aria-hidden="true">
        {Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => (
          <div
            key={index}
            className={cn(
              'flex h-12 min-w-0 flex-1 items-center justify-center rounded-md border border-grey-3 bg-white text-heading2 text-grey-8',
              isFocused &&
                index === Math.min(shownCode.length, INVITE_CODE_LENGTH - 1) &&
                'border-ns-blue',
              hasError && 'border-ns-buy',
              // 확인 중 모양은 시안에 없어 임시 (Grey/0 바탕, Grey/4 글자)
              disabled && 'bg-grey-0 text-grey-4',
            )}
          >
            {shownCode[index] ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CodeInput;
