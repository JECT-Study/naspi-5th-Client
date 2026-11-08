import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { AlertCircleIcon } from './icons';

interface FieldMessageProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

// ⓘ 아이콘이 붙은 빨간 안내 문구 (입력 오류, 코드 확인 실패 등)
function FieldMessage({ id, children, className }: FieldMessageProps) {
  return (
    <p id={id} className={cn('flex items-center gap-1 text-xs text-red-500', className)}>
      <AlertCircleIcon className="size-3.5" />
      {children}
    </p>
  );
}

export default FieldMessage;
