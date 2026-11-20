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
          const raw = event.target.value;
          const isComposing =
            event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing;
          if (isComposing && normalizeInviteCode(raw).length < INVITE_CODE_LENGTH) {
            setComposingValue(raw);
            return;
          }
          // 마지막 칸을 한글 자판으로 채우면 조합이 끝나지 않아 코드가 넘어가지 않는다 (확인이 시작되지 않음)
          // 7칸이 다 차면 입력창에서 포커스를 빼서 조합을 끝내고 바로 넘긴다. 확인이 끝나면 위에서 포커스를 돌려준다
          if (isComposing) inputRef.current?.blur();
          commit(raw);
        }}
        onCompositionEnd={(event) => commit(event.currentTarget.value)}
      />
      {/* 시안 Invitation Code Input: 36×48 칸 7개, 사이 10 (묶음 폭 312)
          칸 폭은 화면이 넓어져도 36 고정, 묶음은 가운데 정렬 (시안 섹션 정렬 CENTER, 디자이너 확인)
          칸은 모서리 6, 흰색 + Grey/3 테두리, 글자 Heading2 Grey/8
          입력 중에는 다음에 입력할 칸이 NSBlue (다 채우면 마지막 칸), 오류면 모든 칸이 NSBuy
          화면설계서 코드로 참여 1 "입력 완료 시 다음 칸으로 포커스 이동" (시안은 첫 칸이 파란 예시 한 장뿐) */}
      <div className="flex gap-2.5" aria-hidden="true">
        {Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => (
          <div
            key={index}
            className={cn(
              'flex h-12 w-9 items-center justify-center rounded-md border border-grey-3 bg-white text-heading2 text-grey-8',
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
