import { useState } from 'react';
import { PENDING_INDICATOR_DELAY_MS } from '@/hooks/useDelayedFlag';
import { clearNetworkError, isNetworkError } from '@/libs/networkError';
import { queryClient } from '@/libs/queryClient';
import Button from './Button';

// [네트워크 오류] 페이지 (화면설계서 공통 8). 아래 화면은 그대로 두고 위에 덮는다
// 아래 화면이 살아 있어야 그 화면의 조회(active 쿼리)를 다시 할 수 있다
function NetworkErrorPage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showsWaiting, setShowsWaiting] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    // 0.3초보다 오래 걸리면 네트워크 대기 중 표시 (화면설계서 공통 8-1)
    const timer = setTimeout(() => setShowsWaiting(true), PENDING_INDICATOR_DELAY_MS);
    await queryClient.refetchQueries({ type: 'active' });
    clearTimeout(timer);

    // 아직 네트워크 오류로 실패한 조회가 남아 있으면 페이지를 유지하고 버튼을 되돌린다
    const stillFailing = queryClient
      .getQueryCache()
      .findAll({ type: 'active' })
      .some((query) => query.state.status === 'error' && isNetworkError(query.state.error));
    if (!stillFailing) clearNetworkError();
    setIsRetrying(false);
    setShowsWaiting(false);
  };

  return (
    <div className="absolute inset-0 z-45 flex flex-col items-center justify-center gap-2 bg-white px-9 text-center">
      {showsWaiting ? (
        <p className="text-sm text-gray-500">네트워크 연결을 기다리는 중이에요…</p>
      ) : (
        <>
          <h1 className="text-lg font-bold">앗, 인터넷 연결이 끊겼어요.</h1>
          <p className="text-sm text-gray-500">
            와이파이나 모바일 데이터 연결을 확인하고
            <br />
            다시 시도해 주세요.
          </p>
          <Button className="mt-6 w-full" disabled={isRetrying} onClick={handleRetry}>
            다시 불러오기
          </Button>
        </>
      )}
    </div>
  );
}

export default NetworkErrorPage;
