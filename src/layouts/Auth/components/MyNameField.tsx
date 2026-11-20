import { useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/apis/domains/user/user.queries';
import { updateMyName } from '@/apis/domains/user/user.service';
import {
  INVALID_NAME_MESSAGE,
  NAME_MAX_LENGTH,
  validateNameForm,
} from '@/apis/domains/user/user.validation';
import { PencilIcon } from '@/components/ui/icons';
import TextField from '@/components/ui/TextField';
import { getApiErrorCode } from '@/libs/apiError';

interface MyNameFieldProps {
  /** 아직 불러오는 중이면 없다. 그동안 '수정'은 누를 수 없다 */
  name?: string;
}

// 누를 수 없을 때(공란, 저장 중)는 시안에 없어 Grey/4 (모달 버튼 비활성 색과 같게)
const TEXT_BUTTON_CLASS = 'text-button3 text-grey-5 disabled:text-grey-4';

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

  const handleSubmit = (event: SubmitEvent) => {
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

  // 시안 (공통 내 계정 정보): 오류 문구는 입력칸 위, 작은 입력칸(높이 22) + 간격 16 + "취소"·"저장"(Button3 Grey/5, 간격 6)
  return (
    <form className="mt-1 flex items-end gap-4" onSubmit={handleSubmit}>
      <TextField
        aria-label="이름"
        size="sm"
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
      <div className="flex h-5.5 shrink-0 items-center gap-1.5">
        <button
          type="button"
          className={TEXT_BUTTON_CLASS}
          disabled={isPending}
          onClick={() => setDraft(null)}
        >
          취소
        </button>
        <button
          type="submit"
          className={TEXT_BUTTON_CLASS}
          disabled={draft.trim() === '' || isPending}
          aria-busy={isPending || undefined}
        >
          저장
        </button>
      </div>
    </form>
  );
}

export default MyNameField;
