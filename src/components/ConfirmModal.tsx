import type { ReactNode } from 'react';
import Button from './Button';
import Modal from './Modal';

interface ConfirmModalProps {
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  /** 요청 중에는 두 버튼을 막아 중복 요청과 닫힘을 막는다 */
  isPending?: boolean;
  /** 입력 폼이 있는 모달이면 그 form의 id. 확인 버튼이 submit 버튼이 되어 Enter로도 제출된다 */
  formId?: string;
  onConfirm?: () => void;
  /** 없으면 취소 버튼 없이 확인만 보여준다 (회원가입 이름 입력처럼 건너뛸 수 없는 모달) */
  onCancel?: () => void;
}

// 제목 + 설명 + 취소/확인 버튼 모달 (로그아웃, 탈퇴, 이름 수정, 리그 시작, 삭제 확인 등)
// X 버튼이 없는 모달이라 취소를 누르거나, 확인 후 요청이 성공했을 때(부르는 쪽에서 닫음)만 닫힌다
function ConfirmModal({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = '취소',
  confirmDisabled = false,
  isPending = false,
  formId,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      description={description}
      footer={
        <>
          {onCancel && (
            <Button
              variant="secondary"
              className="h-11 flex-1"
              disabled={isPending}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type={formId ? 'submit' : 'button'}
            form={formId}
            className="h-11 flex-1"
            disabled={confirmDisabled || isPending}
            onClick={formId ? undefined : onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export default ConfirmModal;
