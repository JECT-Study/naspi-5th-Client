import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useGnbDrawerStore } from '@/stores/gnbDrawerStore';

// 로그아웃·탈퇴 뒤 정리: 랜딩으로 보내고, 이전 사용자의 캐시와 스토어를 비운다
// 사용자 단위 스토어가 늘어나면 여기서 함께 clear한다
export const useEndSession = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const clearGnbDrawer = useGnbDrawerStore((state) => state.clearGnbDrawer);

  return () => {
    navigate('/', { replace: true });
    clearGnbDrawer();
    queryClient.clear();
  };
};
