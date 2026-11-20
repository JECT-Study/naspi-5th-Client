import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Modal from './Modal';

interface ConfirmModalProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  /** 요청 중에는 두 버튼과 X·바깥 클릭을 막아 중복 요청과 닫힘을 막는다 */
  isPending?: boolean;
  /** 입력 폼이 있는 모달이면 그 form의 id. 확인 버튼이 submit 버튼이 되어 Enter로도 제출된다 */
  formId?: string;
  /** 본문 좌우 여백 (시안: 기본 12, 탈퇴 8) */
  contentClassName?: string;
  onConfirm?: () => void;
  /** 없으면 취소·X 없이 확인만 보여준다 (회원가입 이름 입력처럼 건너뛸 수 없는 모달) */
  onCancel?: () => void;
}

// 시안 모달 하단 버튼: Button2.5 글자 버튼. 두 칸이면 사이에 세로 구분선(Grey/1 0.8)
const ACTION_BUTTON_CLASS = 'flex-1 text-button2-5';

// 제목 + 설명 + 취소/확인 버튼 모달 (로그아웃, 탈퇴, 리그 시작, 삭제·나가기·주문 취소 확인 등)
// 취소가 있으면 시안처럼 오른쪽 위 X도 생기고, X·바깥 클릭은 취소와 같다 (화면설계서에는 X가 리그 시작·로그인에만 있지만 시안을 따름)
// 확인 후 요청이 성공했을 때는 부르는 쪽에서 닫는다
function ConfirmModal({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = '취소',
  confirmDisabled = false,
  isPending = false,
  formId,
  contentClassName,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      description={description}
      contentClassName={contentClassName}
      onClose={onCancel}
      isCloseBlocked={isPending}
      footer={
        <>
          {onCancel && (
            <button
              type="button"
              className={cn(ACTION_BUTTON_CLASS, 'text-grey-5')}
              disabled={isPending}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          )}
          {/* 누를 수 없으면 Grey/4 (시안에 비활성 모양이 없어 오버레이 상단바 비활성 색을 따름) */}
          <button
            type={formId ? 'submit' : 'button'}
            form={formId}
            className={cn(
              ACTION_BUTTON_CLASS,
              'text-ns-blue disabled:text-grey-4',
              onCancel && 'border-l-[0.8px] border-grey-1',
            )}
            disabled={confirmDisabled || isPending}
            aria-busy={isPending || undefined}
            onClick={formId ? undefined : onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export default ConfirmModal;
