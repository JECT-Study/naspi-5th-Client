import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/apis/domains/user/user.queries';
import { updateMyName } from '@/apis/domains/user/user.service';
import { NAME_MAX_LENGTH, validateNameForm } from '@/apis/domains/user/user.validation';
import TextField from '@/components/TextField';

interface MyNameFieldProps {
  /** 아직 불러오는 중이면 없다. 그동안 '수정'은 누를 수 없다 */
  name?: string;
}

const smallButton = 'shrink-0 rounded border px-2 py-0.5 text-xs disabled:opacity-40';

// 드로어 '내 계정'의 이름 (화면설계서 v.1.3 공통 1-2: 드로어 안에서 바로 수정)
// '수정'을 누르면 이름이 입력칸으로, 버튼이 '취소'·'저장'으로 바뀐다. 최대 5자 한글, 공란이면 저장 비활성화
// 잘못된 이름이거나 저장에 실패하면 입력값을 그대로 두고 수정 상태를 유지한다 (실패 토스트는 libs/queryClient)
function MyNameField({ name }: MyNameFieldProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const isEditing = draft !== null;

  const { mutate, isPending } = useMutation({
    mutationFn: updateMyName,
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.me(), user);
      setDraft(null);
    },
    meta: { action: '저장' },
  });

  const startEditing = () => {
    setDraft(name ?? '');
    setError(undefined);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (draft === null) return;
    const { isValid, errors } = validateNameForm({ name: draft });
    if (!isValid) {
      setError(errors.name);
      return;
    }
    mutate({ name: draft.trim() });
  };

  if (!isEditing) {
    return (
      <div className="mt-1 flex items-center justify-between">
        <span className="text-lg font-bold">{name}</span>
        <button type="button" className={smallButton} disabled={!name} onClick={startEditing}>
          수정
        </button>
      </div>
    );
  }

  return (
    <form className="mt-1 flex items-end gap-2" onSubmit={handleSubmit}>
      <TextField
        aria-label="이름"
        className="min-w-0 flex-1"
        value={draft}
        maxLength={NAME_MAX_LENGTH}
        error={error}
        autoFocus
        onChange={(event) => {
          setDraft(event.target.value);
          setError(undefined);
        }}
      />
      <div className="flex h-12 items-center gap-1">
        <button
          type="button"
          className={smallButton}
          disabled={isPending}
          onClick={() => setDraft(null)}
        >
          취소
        </button>
        <button type="submit" className={smallButton} disabled={draft.trim() === '' || isPending}>
          {isPending ? '저장 중' : '저장'}
        </button>
      </div>
    </form>
  );
}

export default MyNameField;
