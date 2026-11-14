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
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => (
          <div
            key={index}
            className={cn(
              'flex h-12 flex-1 items-center justify-center rounded-lg border border-gray-300 text-lg font-bold',
              isFocused &&
                index === Math.min(value.length, INVITE_CODE_LENGTH - 1) &&
                'border-gray-900',
              hasError && 'border-red-500',
              disabled && 'bg-gray-50 text-gray-400',
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
