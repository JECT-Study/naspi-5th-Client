import { cn } from '@/utils/cn';

interface StockAvatarProps {
  name: string;
  className?: string;
}

// 종목 프로필: 회색 원 가운데 종목 이름의 첫 글자 (화면설계서 공통)
function StockAvatar({ name, className }: StockAvatarProps) {
  // 이모지처럼 두 단위로 된 글자도 한 글자로 자르도록 Array.from을 쓴다
  const initial = Array.from(name.trim())[0] ?? '';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600',
        className,
      )}
    >
      {initial}
    </div>
  );
}

export default StockAvatar;
