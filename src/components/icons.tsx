import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

// 와이어프레임용 임시 아이콘. 디자인이 나오면 이 파일 안쪽만 바꾼다

interface IconProps {
  className?: string;
}

function Icon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6 shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// 앱 로고 자리. 로고 파일이 나오면 바꾼다
export function LogoIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M8 15l3-3 2 2 3-4" />
    </Icon>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
  );
}

export function PlusCircleIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </Icon>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m15 6-6 6 6 6" />
    </Icon>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function AlertCircleIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </Icon>
  );
}

export function TriangleUpIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 5 21 19H3Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function TriangleDownIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 19 3 5h18Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ThumbUpIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M7 10v11M3 10h4v11H3zM7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7" />
    </Icon>
  );
}

export function ThumbDownIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M17 14V3M21 14h-4V3h4zM17 14l-4 8a3 3 0 0 1-3-3v-4H4.5a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.9 3H17" />
    </Icon>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    </Icon>
  );
}

export function ReplyIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 4v7a4 4 0 0 0 4 4h10M15 11l4 4-4 4" />
    </Icon>
  );
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <Icon className={cn('animate-spin', className)}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Icon>
  );
}

export function MoreIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" />
    </Icon>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Icon>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 6M15 9h.01" />
    </Icon>
  );
}

export function StarIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Icon className={className}>
      <path
        d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </Icon>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />
    </Icon>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </Icon>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m4 12 16-8-6 16-2-7-8-1Z" />
    </Icon>
  );
}

export function CameraIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
      <circle cx="12" cy="13" r="3.5" />
    </Icon>
  );
}

export function RetryIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
    </Icon>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 16l4-4-4-4M19 12H9" />
    </Icon>
  );
}
