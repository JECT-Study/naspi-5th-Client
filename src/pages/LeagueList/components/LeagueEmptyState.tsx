import type { ReactNode } from 'react';
import ErrorIllustration from '@/components/ui/ErrorIllustration';

interface LeagueEmptyStateProps {
  message: ReactNode;
  /** 문구 아래 버튼 묶음 (진행 중인 리그 탭에만 있음) */
  actions?: ReactNode;
}

// 메인 탭의 리그 없음 안내 (시안 '진행 중인 리그 없음 안내', 종료된 리그 빈 상태도 같은 틀)
// - 탭 아래 남은 영역 가운데, 위아래 여백 20, 그림·문구 묶음과 버튼 사이 32
// - 그림 위아래 20, 그림과 문구 사이 18. 문구 Body1.5 Grey/7 가운데 정렬
// - 버튼은 폭 324(화면 좌우 18), 사이 8
function LeagueEmptyState({ message, actions }: LeagueEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4.5 py-5">
      <div className="flex flex-col items-center gap-4.5">
        <div className="py-5">
          <ErrorIllustration />
        </div>
        <p className="text-center text-body1-5 text-grey-7">{message}</p>
      </div>
      {actions && <div className="flex w-full max-w-81 flex-col gap-2">{actions}</div>}
    </div>
  );
}

export default LeagueEmptyState;
