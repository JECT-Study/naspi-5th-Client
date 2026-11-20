import Button from './Button';

import { cn } from '@/utils/cn';

interface LoadErrorProps {
  onRetry: () => void;
  className?: string;
}

// 조회 실패: "정보를 불러오지 못했어요." + 다시 시도
function LoadError({ onRetry, className }: LoadErrorProps) {
  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-3', className)}>
      <p className="text-sm">정보를 불러오지 못했어요.</p>
      {/* TODO: 아이콘 작업 때 시안의 새로고침 아이콘(Refresh 18)을 앞에 붙인다 */}
      <Button variant="small" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}

export default LoadError;
