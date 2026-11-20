import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/apis/domains/user/user.queries';
import { updateMyName } from '@/apis/domains/user/user.service';
import {
  INVALID_NAME_MESSAGE,
  NAME_MAX_LENGTH,
  validateNameForm,
} from '@/apis/domains/user/user.validation';
import { PencilIcon } from '@/components/icons';
import TextField from '@/components/TextField';
import { getApiErrorCode } from '@/libs/apiError';

interface MyNameFieldProps {
  /** 아직 불러오는 중이면 없다. 그동안 '수정'은 누를 수 없다 */
  name?: string;
}

const smallButton = 'shrink-0 rounded border px-2 py-0.5 text-xs disabled:opacity-40';

// 드로어 '내 계정'의 이름 (화면설계서 공통 1-2: 드로어 안에서 바로 수정, POST /api/members/me/name)
// '수정'을 누르면 이름이 입력칸으로, 버튼이 '취소'·'저장'으로 바뀐다. 최대 5자 한글, 공란이면 저장 비활성화
// 잘못된 이름(입력 검사, 서버 101)이면 문자 오류메세지(공통 1-2-1), 그 밖의 저장 실패는 "저장" 실패 토스트(libs/queryClient)
// 어느 쪽이든 입력값을 그대로 두고 수정 상태를 유지한다. 세션이 끝났으면(401·003·103) 랜딩 + 재로그인 모달로 간다
function MyNameField({ name }: MyNameFieldProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const isEditing = draft !== null;

  const { mutate, isPending } = useMutation({
    mutationFn: updateMyName,
    onSuccess: (myName) => {
      queryClient.setQueryData(userKeys.me(), myName);
      setDraft(null);
    },
    meta: { action: '저장', handledErrors: ['101'] },
    onError: (mutationError) => {
      if (getApiErrorCode(mutationError) === '101') setError(INVALID_NAME_MESSAGE);
    },
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
      // 시안: 이름 바로 옆(간격 8)에 Edit 18 아이콘 버튼
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg font-bold">{name}</span>
        <button
          type="button"
          aria-label="이름 수정"
          className="disabled:opacity-40"
          disabled={!name}
          onClick={startEditing}
        >
          <PencilIcon className="text-grey-8" />
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
