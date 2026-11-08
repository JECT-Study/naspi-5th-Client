import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { roomKeys, roomQueries } from '@/apis/domains/room/room.queries';
import { joinRoom } from '@/apis/domains/room/room.service';
import type { RoomErrorCode } from '@/apis/domains/room/room.types';
import { MAX_ACTIVE_ROOMS } from '@/apis/domains/room/room.utils';
import { isInviteCodeComplete, normalizeInviteCode } from '@/apis/domains/room/room.validation';
import Button from '@/components/Button';
import FieldMessage from '@/components/FieldMessage';
import FloatingFooter from '@/components/FloatingFooter';
import { SpinnerIcon } from '@/components/icons';
import TaskHeader from '@/components/TaskHeader';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';
import CodeInput from './components/CodeInput';

// 입장 단계에서 입력창 위에 보여주는 실패 안내. 이 경우 다른 코드를 넣어야 하므로 입장 버튼을 막는다
const JOIN_ERROR_MESSAGES: Partial<Record<RoomErrorCode, string>> = {
  ROOM_FULL: '정원이 가득 찬 대기실이에요. 다른 초대 코드를 입력해 주세요.',
  ROOM_ALREADY_STARTED: '이미 시작된 리그예요. 다른 초대 코드를 입력해 주세요.',
  ROOM_DELETED: '삭제된 대기실이에요. 다른 초대 코드를 입력해 주세요.',
};

interface LeagueJoinOverlayProps {
  /** 초대 링크(/leagues?code=ABCD123)로 들어오면 채워 둘 코드 */
  initialInviteCode?: string;
}

// 코드로 참여 (오버레이): 코드 7자리 입력 → 자동 확인 → "이 대기실에 입장할까요?" → 대기실
// 초대 링크로 들어오면 코드가 채워진 채로 바로 확인한다
function LeagueJoinOverlay({ initialInviteCode = '' }: LeagueJoinOverlayProps) {
  const navigate = useNavigate();
  const openOverlay = useOpenOverlay();
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState(() => normalizeInviteCode(initialInviteCode));

  const isCodeComplete = isInviteCodeComplete(inviteCode);
  const preview = useQuery({ ...roomQueries.invite(inviteCode), enabled: isCodeComplete });
  const previewErrorCode = getApiErrorCode(preview.error) as RoomErrorCode | undefined;

  const join = useMutation({
    mutationFn: joinRoom,
    onSuccess: ({ roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
      navigate(`/leagues/${roomId}/waiting`, { replace: true });
    },
    // 정원·시작·삭제는 입력창 위 문구(JOIN_ERROR_MESSAGES), 리그 수 제한은 전용 토스트, 그 밖은 공통 토스트
    meta: {
      action: '입장',
      handledErrors: [
        'ROOM_FULL',
        'ROOM_ALREADY_STARTED',
        'ROOM_DELETED',
        'ACTIVE_ROOM_LIMIT_EXCEEDED',
      ] satisfies RoomErrorCode[],
    },
    onError: (error) => {
      if ((getApiErrorCode(error) as RoomErrorCode | undefined) === 'ACTIVE_ROOM_LIMIT_EXCEEDED') {
        notify.error(`리그는 동시에 ${MAX_ACTIVE_ROOMS}개까지만 진행할 수 있어요.`);
      }
    },
  });
  const joinErrorCode = getApiErrorCode(join.error) as RoomErrorCode | undefined;
  const joinErrorMessage = joinErrorCode && JOIN_ERROR_MESSAGES[joinErrorCode];

  const handleCodeChange = (code: string) => {
    setInviteCode(code);
    join.reset();
  };

  // 코드 확인 결과 (코드로 참여 1)
  // - 없는 코드: 입력칸을 비우고 첫 칸부터 다시 입력. 오류 문구는 새로 입력을 시작하면 사라진다
  // - 확인할 수 없음(서버 오류 등): 입력한 코드를 그대로 두고 다시 시도
  const renderCodeStep = () => {
    const isChecking = isCodeComplete && preview.isFetching;
    const hasCheckError = isCodeComplete && !isChecking && preview.isError;
    const isInvalidCode = hasCheckError && previewErrorCode === 'INVALID_INVITE_CODE';
    return (
      <>
        <h2 className="text-lg font-bold">
          {isChecking ? '코드를 확인 중이에요...' : '코드를 입력해 주세요.'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          공유 받은 참여 코드를 통해 대기실에 입장하세요.
        </p>
        {hasCheckError && (
          <FieldMessage className="mt-3">
            {isInvalidCode
              ? '유효하지 않은 초대 코드예요. 코드를 다시 확인해 주세요.'
              : '대기실 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'}
          </FieldMessage>
        )}
        <div className="mt-4">
          <CodeInput
            // 없는 코드면 칸을 비워 보여 준다. 한 글자를 넣으면 그 글자부터 새 코드가 된다
            value={isInvalidCode ? '' : inviteCode}
            disabled={isChecking}
            hasError={hasCheckError}
            onChange={handleCodeChange}
          />
        </div>
        {isChecking && <SpinnerIcon className="mx-auto mt-10 size-12 text-gray-400" />}
        {hasCheckError && !isInvalidCode && (
          <button
            type="button"
            className="mx-auto mt-6 block text-xs text-gray-500 underline"
            onClick={() => preview.refetch()}
          >
            다시 시도
          </button>
        )}
      </>
    );
  };

  const renderConfirmStep = () => {
    if (!preview.data) return null;
    return (
      <>
        <h2 className="text-lg font-bold">이 대기실에 입장할까요?</h2>
        <p className="mt-1 text-sm text-gray-500">
          대기실에서 상장을 완료하면, 참여 준비가 완료돼요.
        </p>
        {joinErrorMessage && <FieldMessage className="mt-3">{joinErrorMessage}</FieldMessage>}
        <div className="mt-4 flex flex-col gap-2 rounded-lg border px-6 py-5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-bold">{preview.data.name}</span>
            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs">대기</span>
          </div>
          <span className="text-xs text-gray-500">{preview.data.listedCount}명 상장 완료</span>
        </div>
        <button
          type="button"
          className="mt-4 text-sm text-gray-500"
          onClick={() => handleCodeChange('')}
        >
          ← 코드 다시 입력하기
        </button>
      </>
    );
  };

  const isConfirmStep = isCodeComplete && preview.isSuccess;

  return (
    <>
      <TaskHeader title="코드로 참여" />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-9 pt-4">
        {isConfirmStep ? renderConfirmStep() : renderCodeStep()}
        <FloatingFooter>
          <div className="flex flex-col items-center gap-3">
            {isConfirmStep && (
              <Button
                className="w-full"
                disabled={Boolean(joinErrorMessage)}
                isPending={join.isPending}
                pendingLabel="입장 중..."
                onClick={() => join.mutate({ inviteCode })}
              >
                대기실 입장하기
              </Button>
            )}
            {/* 작업형 화면끼리 전환: 오버레이 내용만 바꾼다 (기록은 그대로) */}
            <button
              type="button"
              className="text-xs text-gray-500 underline"
              onClick={() => openOverlay({ type: 'leagueCreate' })}
            >
              또는 새 리그 만들기
            </button>
          </div>
        </FloatingFooter>
      </main>
    </>
  );
}

export default LeagueJoinOverlay;
