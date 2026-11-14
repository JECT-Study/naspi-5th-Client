import { useMutation } from '@tanstack/react-query';
import { logout } from '@/apis/domains/auth/auth.service';
import ConfirmModal from '@/components/ConfirmModal';
import { useEndSession } from '@/hooks/useEndSession';

interface LogoutModalProps {
  onClose: () => void;
}

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
