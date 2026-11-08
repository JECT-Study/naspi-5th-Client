import { cn } from '@/utils/cn';

// Button과 ButtonLink가 같은 모양을 쓰도록 클래스를 한곳에서 만든다. 디자인이 나오면 여기만 바꾼다

export type ButtonVariant = 'primary' | 'secondary';

// 비활성은 반투명(opacity) 대신 불투명한 색으로: 하단에 떠 있는 버튼 뒤로 내용이 비쳐 보이지 않게
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-gray-900 text-white disabled:bg-gray-300',
  secondary: 'border border-gray-300 bg-white disabled:text-gray-300',
};

export const getButtonClassName = (variant: ButtonVariant, className?: string) =>
  cn(
    'flex h-12 items-center justify-center rounded-lg px-4 font-bold',
    VARIANT_CLASS[variant],
    className,
  );
