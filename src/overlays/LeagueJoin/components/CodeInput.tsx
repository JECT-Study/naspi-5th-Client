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

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        autoFocus
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        aria-label={`초대 코드 ${INVITE_CODE_LENGTH}자리`}
        className="absolute inset-0 z-10 cursor-text opacity-0"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(normalizeInviteCode(event.target.value))}
      />
      {/* 시안 Invitation Code Input: 36×48 칸 7개를 양 끝에 맞춰 놓는다 (312 폭에서 간격 10)
          칸은 모서리 6, 흰색 + Grey/3 테두리, 글자 Heading2 Grey/8
          입력 중에는 마지막으로 입력한 칸(아무것도 없으면 첫 칸)이 NSBlue, 오류면 모든 칸이 NSBuy */}
      <div className="flex justify-between" aria-hidden="true">
        {Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => (
          <div
            key={index}
            className={cn(
              'flex h-12 w-9 items-center justify-center rounded-md border border-grey-3 bg-white text-heading2 text-grey-8',
              isFocused && index === Math.max(value.length - 1, 0) && 'border-ns-blue',
              hasError && 'border-ns-buy',
              // 확인 중 모양은 시안에 없어 임시 (Grey/0 바탕, Grey/4 글자)
              disabled && 'bg-grey-0 text-grey-4',
            )}
          >
            {value[index] ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CodeInput;
