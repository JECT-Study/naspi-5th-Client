import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { withdraw } from '@/apis/domains/user/user.service';
import ConfirmModal from '@/components/ConfirmModal';
import FieldMessage from '@/components/FieldMessage';
import NoticeModal from '@/components/NoticeModal';
import { useEndSession } from '@/hooks/useEndSession';

interface WithdrawModalProps {
  onClose: () => void;
}

type WithdrawStep = 'confirm' | 'done';

// 탈퇴 확인 → 완료 안내(1초) → 랜딩
function WithdrawModal({ onClose }: WithdrawModalProps) {
  const endSession = useEndSession();
  const [step, setStep] = useState<WithdrawStep>('confirm');
  const [isAgreed, setIsAgreed] = useState(false);

  const { mutate, isPending, isError, reset } = useMutation({
    mutationFn: withdraw,
    onSuccess: () => setStep('done'),
    // 실패는 토스트가 아니라 모달 안 체크박스 아래 문구 (공통 1-4-2, Figma)
    meta: { handledErrors: 'all' },
  });

  if (step === 'done') {
    return <NoticeModal title="회원 탈퇴가 완료되었습니다." onDone={endSession} />;
  }

  return (
    <ConfirmModal
      title="정말 탈퇴하시겠습니까?"
      description={
        '진행 중인 모든 리그에서 제외됩니다.\n상장한 종목과 공시, 뉴스, 댓글은 모두 유지됩니다.'
      }
      confirmLabel="탈퇴하기"
      confirmDisabled={!isAgreed}
      isPending={isPending}
      onConfirm={() => {
        reset();
        mutate();
      }}
      onCancel={onClose}
    >
      <label className="flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={isAgreed}
          onChange={(event) => setIsAgreed(event.target.checked)}
        />
        안내를 확인했고, 되돌릴 수 없다는 것을 이해했습니다.
      </label>
      {isError && (
        <FieldMessage className="mt-2">
          탈퇴 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.
        </FieldMessage>
      )}
    </ConfirmModal>
  );
}

export default WithdrawModal;
