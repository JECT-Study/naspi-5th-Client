import { useId, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/apis/domains/user/user.queries';
import { updateMyName } from '@/apis/domains/user/user.service';
import { NAME_MAX_LENGTH, validateNameForm } from '@/apis/domains/user/user.validation';
import ConfirmModal from './ConfirmModal';
import TextField from './TextField';

interface NameFormModalProps {
  title: string;
  onSaved: () => void;
}

// 이름 입력 모달 (공통 3, 로그인 후 이름이 유효하지 않을 때): 최대 5자 한글, 공란이면 확인 비활성화, 취소 없음
// 잘못된 이름·저장 실패 시 입력값을 그대로 두고 모달을 유지한다
// 드로어의 이름 수정(공통 1-2)은 모달이 아니라 드로어 안에서 한다 (layouts/Auth/components/MyNameField)
function NameFormModal({ title, onSaved }: NameFormModalProps) {
  const queryClient = useQueryClient();
  const formId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const { mutate, isPending } = useMutation({
    mutationFn: updateMyName,
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.me(), user);
      onSaved();
    },
    // 실패하면 입력값을 그대로 두고 "저장 중 문제가 발생했어요. …" (공통 5-1, libs/queryClient)
    meta: { action: '저장' },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const { isValid, errors } = validateNameForm({ name });
    if (!isValid) {
      setError(errors.name);
      return;
    }
    mutate({ name: name.trim() });
  };

  return (
    <ConfirmModal
      title={title}
      confirmLabel="확인"
      formId={formId}
      confirmDisabled={name.trim() === ''}
      isPending={isPending}
    >
      <form id={formId} onSubmit={handleSubmit}>
        <TextField
          aria-label="이름"
          placeholder="이름을 입력해 주세요."
          value={name}
          maxLength={NAME_MAX_LENGTH}
          error={error}
          autoFocus
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
        />
      </form>
    </ConfirmModal>
  );
}

export default NameFormModal;
