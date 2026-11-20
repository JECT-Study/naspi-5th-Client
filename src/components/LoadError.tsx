import { cn } from '@/utils/cn';
import RetryButton from './RetryButton';

interface LoadErrorProps {
  onRetry: () => void;
  className?: string;
}

// 조회 실패: "정보를 불러오지 못했어요." + 다시 시도
function LoadError({ onRetry, className }: LoadErrorProps) {
  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-3', className)}>
      <p className="text-sm">정보를 불러오지 못했어요.</p>
      <RetryButton onClick={onRetry} />
    </div>
  );
}

export default LoadError;
