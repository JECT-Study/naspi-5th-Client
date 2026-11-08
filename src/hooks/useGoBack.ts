import { useNavigate } from 'react-router';

// React Router가 history state에 남기는 기록 순번. push하면 1씩 늘고 replace하면 그대로다
// 0이면 이 앱에서 처음 연 화면이라 뒤로 가면 앱 밖으로 나간다
export const hasPreviousPage = () => (window.history.state?.idx ?? 0) > 0;

/**
 * 사용자 히스토리 기준 이전 페이지로 이동한다 (화면설계서 공통 4-3, 4-4)
 * 주소로 바로 들어와 앱 안에 이전 페이지가 없으면 fallbackTo(상위 화면)로 간다
 */
export const useGoBack = (fallbackTo = '/leagues') => {
  const navigate = useNavigate();

  return () => {
    if (hasPreviousPage()) navigate(-1);
    else navigate(fallbackTo, { replace: true });
  };
};
