import { cn } from '@/utils/cn';
import ErrorIllustration from './ErrorIllustration';
import RetryButton from './RetryButton';

interface LoadErrorProps {
  onRetry: () => void;
  /**
   * page: 화면(영역) 전체를 대신하는 조회 실패 (시안 Error State: 마스코트 + 문구 + 다시 시도, 간격 18)
   * inline: 목록 아래·작은 영역 안의 조회 실패 (마스코트 없이 문구 + 다시 시도)
   */
  size?: 'page' | 'inline';
  className?: string;
}

// 조회 실패: "정보를 불러오지 못했어요." (Body1 Grey/7) + 다시 시도
function LoadError({ onRetry, size = 'page', className }: LoadErrorProps) {
  const isPage = size === 'page';
  return (
    <div
      className={cn(
        'flex flex-col items-center',
        isPage ? 'flex-1 justify-center gap-4.5 pt-2 pb-8' : 'gap-3',
        className,
      )}
    >
      {isPage && <ErrorIllustration />}
      <p className="text-body1 text-grey-7">정보를 불러오지 못했어요.</p>
      <RetryButton onClick={onRetry} />
    </div>
  );
}

export default LoadError;
