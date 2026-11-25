import { useId, useState, type SubmitEvent } from 'react';
import { NAME_MAX_LENGTH, validateNameForm } from '@/apis/domains/user/user.validation';
import ConfirmModal from '@/components/overlay/ConfirmModal';
import TextField from '@/components/ui/TextField';

interface NameFormModalProps {
  title: string;
  isPending: boolean;
  /** 서버가 거절한 이유 (이름 규칙 위반 등). 다시 입력을 시작하면 부르는 쪽에서 지운다 */
  serverError?: string;
  /** 입력값이 바뀔 때 (서버 오류 문구를 지우는 데 쓴다) */
  onChange?: () => void;
  /** 검사를 통과한 이름 (앞뒤 공백 제거) */
  onSubmit: (name: string) => void;
}

// 이름 입력 모달 (공통 3): 최대 5자 한글, 공란이면 확인 비활성화, 취소·X 없음
// 잘못된 이름·저장 실패 시 입력값을 그대로 두고 모달을 유지한다
// 저장(API 호출)은 부르는 쪽이 한다. 지금은 이름 입력 회원가입(/signup)에서 쓴다
// 드로어의 이름 수정(공통 1-2)은 모달이 아니라 드로어 안에서 한다 (layouts/Auth/components/MyNameField)
function NameFormModal({ title, isPending, serverError, onChange, onSubmit }: NameFormModalProps) {
  const formId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const { isValid, errors } = validateNameForm({ name });
    if (!isValid) {
      setError(errors.name);
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <ConfirmModal
      title={title}
      confirmLabel="확인"
      formId={formId}
      confirmDisabled={name.trim() === ''}
      isPending={isPending}
    >
      {/* 시안: 제목과 입력칸 사이 16 (모달 기본 간격 8 + 8) */}
      <form id={formId} className="mt-2 w-full" onSubmit={handleSubmit}>
        <TextField
          aria-label="이름"
          placeholder="이름을 입력해 주세요."
          value={name}
          maxLength={NAME_MAX_LENGTH}
          // 시안: 모달 입력칸은 글자 수 오른쪽 10
          counterInset={10}
          error={error ?? serverError}
          autoFocus
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
            onChange?.();
          }}
        />
      </form>
    </ConfirmModal>
  );
}

export default NameFormModal;
