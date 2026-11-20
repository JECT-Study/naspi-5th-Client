import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { AlertCircleIcon } from './icons';

interface FieldMessageProps {
  id?: string;
  children: ReactNode;
  /** error: 빨간 오류 문구 (기본) / info: 회색 안내 문구 (원문 공시 삭제) */
  tone?: 'error' | 'info';
  className?: string;
}

const TONE_CLASS = {
  error: 'text-ns-buy',
  info: 'text-grey-8',
} as const;

// 느낌표 아이콘이 붙은 문구 (시안 ErrorMessage: Notice 18 + 간격 4 + Body2.5, 아이콘은 줄 위에서 1)
// 입력 오류, 코드 확인 실패 등은 빨강, 원문 공시 삭제 안내는 회색 (시안 Message/원문공시삭제)
// 좁은 화면에서 두 줄이 되면 낱말 단위로 넘기고(break-keep), 아이콘은 첫 줄 옆에 둔다
function FieldMessage({ id, children, tone = 'error', className }: FieldMessageProps) {
  return (
    <p
      id={id}
      className={cn('flex items-start gap-1 text-body2-5 break-keep', TONE_CLASS[tone], className)}
    >
      <AlertCircleIcon size={18} className="mt-px shrink-0" />
      {children}
    </p>
  );
}

export default FieldMessage;
