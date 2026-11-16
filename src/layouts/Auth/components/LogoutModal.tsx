import { useMutation } from '@tanstack/react-query';
import { logout } from '@/apis/domains/auth/auth.service';
import ConfirmModal from '@/components/ConfirmModal';
import { useEndSession } from '@/hooks/useEndSession';

interface LogoutModalProps {
  onClose: () => void;
}

// 로그아웃 확인 (공통 1-3, POST /api/auth/logout)
// 성공하면 이전 사용자의 캐시를 비우고 랜딩으로 (hooks/useEndSession). 실패하면 "로그아웃" 실패 토스트, 모달 유지
function LogoutModal({ onClose }: LogoutModalProps) {
  const endSession = useEndSession();
  const { mutate, isPending } = useMutation({
    mutationFn: logout,
    onSuccess: endSession,
    meta: { action: '로그아웃' },
  });

  return (
    <ConfirmModal
      title="로그아웃할까요?"
      confirmLabel="로그아웃"
      isPending={isPending}
      onConfirm={() => mutate()}
      onCancel={onClose}
    />
  );
}

export default LogoutModal;
