import { useState } from 'react';
import { clearNetworkError, isNetworkError } from '@/libs/networkError';
import { queryClient } from '@/libs/queryClient';
import Button from '@/components/ui/Button';
import { ErrorPageLayout } from '@/components/status/ErrorPage';

// [네트워크 오류] 페이지 (화면설계서 공통 8). 아래 화면은 그대로 두고 위에 덮는다
// 아래 화면이 살아 있어야 그 화면의 조회(active 쿼리)를 다시 할 수 있다
// v.1.8에서 0.3초를 넘기면 보여주던 "네트워크 대기 중"(8-1) 표시가 빠졌다. 다시 불러오는 동안은 버튼만 막는다
function NetworkErrorPage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await queryClient.refetchQueries({ type: 'active' });

    // 아직 네트워크 오류로 실패한 조회가 남아 있으면 페이지를 유지하고 버튼을 되돌린다
    const stillFailing = queryClient
      .getQueryCache()
      .findAll({ type: 'active' })
      .some((query) => query.state.status === 'error' && isNetworkError(query.state.error));
    if (!stillFailing) clearNetworkError();
    setIsRetrying(false);
  };

  // 시안 네트워크 오류 페이지: 공통 오류 페이지와 같은 틀 (설명만 두 줄)
  return (
    <ErrorPageLayout
      className="absolute inset-0 z-45 bg-white"
      title="앗, 인터넷 연결이 끊겼어요."
      description={
        <>
          와이파이나 모바일 데이터 연결을 확인하고
          <br />
          다시 시도해 주세요.
        </>
      }
      action={
        <Button variant="small" disabled={isRetrying} onClick={handleRetry}>
          다시 불러오기
        </Button>
      }
    />
  );
}

export default NetworkErrorPage;
