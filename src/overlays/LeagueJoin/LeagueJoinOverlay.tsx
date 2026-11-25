import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { roomKeys, roomQueries } from '@/apis/domains/room/room.queries';
import { joinRoom } from '@/apis/domains/room/room.service';
import { ROOM_ERROR_CODE, type RoomErrorCode } from '@/apis/domains/room/room.types';
import { ACTIVE_ROOM_LIMIT_MESSAGE } from '@/apis/domains/room/room.utils';
import { isInviteCodeComplete } from '@/apis/domains/room/room.validation';
import Button from '@/components/ui/Button';
import FieldMessage from '@/components/ui/FieldMessage';
import FloatingFooter from '@/components/ui/FloatingFooter';
import FormSection from '@/components/ui/FormSection';
import { SpinnerIcon } from '@/components/ui/icons';
import RetryButton from '@/components/ui/RetryButton';
import TaskHeader from '@/components/header/TaskHeader';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';
import CodeInput from './components/CodeInput';

// 초대 코드 오류 문구 (코드 확인·입장 공통)
// 삭제·만료·종료로 폐기된 코드는 서버가 없는 코드(201)로 준다 → '유효하지 않은 코드'로 안내 (시안의 '삭제된 대기실이에요.'는 쓰지 않음, 팀 결정)
const INVALID_CODE_MESSAGE = '유효하지 않은 코드예요. 코드를 다시 확인해 주세요.';
const ALREADY_STARTED_MESSAGE = '이미 시작된 리그예요. 다른 초대 코드를 입력해 주세요.';

// 코드 확인 단계에서 다른 코드를 넣어야 하는 실패. 입력칸을 비우고 첫 칸부터 다시 입력
const CODE_ERROR_MESSAGES: Partial<Record<RoomErrorCode, string>> = {
  [ROOM_ERROR_CODE.INVALID_INVITE_CODE]: INVALID_CODE_MESSAGE,
  [ROOM_ERROR_CODE.ALREADY_STARTED]: ALREADY_STARTED_MESSAGE,
};

// 입장 단계에서 입력창 위에 보여주는 실패 안내. 이 경우 다른 코드를 넣어야 하므로 입장 버튼을 막는다
// (확인 뒤 그사이 리그가 시작됐거나(208) 대기실이 삭제·만료됐거나(201) 정원이 찬 경우(203))
const JOIN_ERROR_MESSAGES: Partial<Record<RoomErrorCode, string>> = {
  [ROOM_ERROR_CODE.ROOM_FULL]: '정원이 가득 찼어요. 다른 초대 코드를 입력해 주세요.',
  [ROOM_ERROR_CODE.ALREADY_STARTED]: ALREADY_STARTED_MESSAGE,
  [ROOM_ERROR_CODE.INVALID_INVITE_CODE]: INVALID_CODE_MESSAGE,
};

// 코드로 참여 (오버레이): 코드 7자리 입력 → 자동 확인 → "이 대기실에 입장할까요?" → 대기실
function LeagueJoinOverlay() {
  const navigate = useNavigate();
  const openOverlay = useOpenOverlay();
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState('');

  const isCodeComplete = isInviteCodeComplete(inviteCode);
  const preview = useQuery({ ...roomQueries.invite(inviteCode), enabled: isCodeComplete });
  const previewErrorCode = getApiErrorCode(preview.error) as RoomErrorCode | undefined;

  // 오버레이 기록을 대기실로 바꿔치기한다 (오버레이는 닫히고, 뒤로 가기를 누르면 열기 전 화면)
  const goToWaitingRoom = (roomId: number) => {
    queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
    navigate(`/leagues/${roomId}/waiting`, { replace: true });
  };

  const join = useMutation({
    mutationFn: joinRoom,
    onSuccess: ({ roomId }) => goToWaitingRoom(roomId),
    // 정원·시작·폐기된 코드는 입력창 위 문구(JOIN_ERROR_MESSAGES), 리그 수 제한은 전용 토스트, 그 밖은 공통 토스트
    // 이미 입장한 리그(202)는 실패로 보지 않고 그 대기실로 간다 (API 문서 "해당 리그 대기실로 이동")
    meta: {
      action: '입장',
      handledErrors: [
        ROOM_ERROR_CODE.ROOM_FULL,
        ROOM_ERROR_CODE.ALREADY_STARTED,
        ROOM_ERROR_CODE.INVALID_INVITE_CODE,
        ROOM_ERROR_CODE.ACTIVE_ROOM_LIMIT_EXCEEDED,
        ROOM_ERROR_CODE.ALREADY_JOINED,
      ],
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === ROOM_ERROR_CODE.ACTIVE_ROOM_LIMIT_EXCEEDED)
        notify.error(ACTIVE_ROOM_LIMIT_MESSAGE);
      if (code === ROOM_ERROR_CODE.ALREADY_JOINED && preview.data) {
        goToWaitingRoom(preview.data.roomId);
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
  // - 없는 코드(201)·이미 시작된 리그(208): 입력칸을 비우고 첫 칸부터 다시 입력. 오류 문구는 새로 입력을 시작하면 사라진다
  // - 확인할 수 없음(서버 오류 등): 입력한 코드를 그대로 두고 다시 시도
  const renderCodeStep = () => {
    const isChecking = isCodeComplete && preview.isFetching;
    const hasCheckError = isCodeComplete && !isChecking && preview.isError;
    const rejectedMessage =
      hasCheckError && previewErrorCode && CODE_ERROR_MESSAGES[previewErrorCode];
    const isCodeRejected = Boolean(rejectedMessage);
    return (
      <>
        <FormSection
          title={isChecking ? '초대 코드를 확인 중이에요...' : '초대 코드를 입력해 주세요.'}
          description="공유받은 초대 코드로 대기실에 입장하세요."
        >
          {/* 시안: 오류 문구는 코드 칸 바로 위 (사이 4). 칸 묶음(폭 312 고정)과 오류 문구를 함께 가운데에 두고, 문구는 칸 왼쪽 끝에 맞춘다 */}
          <div className="flex flex-col gap-1 self-center">
            {hasCheckError && (
              <FieldMessage>
                {rejectedMessage || '대기실 정보를 불러오지 못했어요. 다시 시도해 주세요.'}
              </FieldMessage>
            )}
            <CodeInput
              // 없는 코드면 칸을 비워 보여 준다. 한 글자를 넣으면 그 글자부터 새 코드가 된다
              value={isCodeRejected ? '' : inviteCode}
              disabled={isChecking}
              hasError={hasCheckError}
              onChange={handleCodeChange}
            />
          </div>
          {/* 확인 중 표시는 시안에 없어 임시 */}
          {isChecking && <SpinnerIcon className="mx-auto mt-6 size-12 text-grey-4" />}
        </FormSection>
        {/* 시안 '대기실 조회 실패': 섹션 바로 아래 가운데, 아래 8 띄우고 "또는 새 리그 만들기" */}
        {hasCheckError && !isCodeRejected && (
          <RetryButton className="mx-auto mb-2" onClick={() => preview.refetch()} />
        )}
      </>
    );
  };

  const renderConfirmStep = () => {
    if (!preview.data) return null;
    return (
      <FormSection
        title="이 대기실에 입장할까요?"
        description="대기실에서 상장을 완료하면, 참여 준비가 완료돼요."
      >
        {joinErrorMessage && <FieldMessage>{joinErrorMessage}</FieldMessage>}
        {/* 시안 List/대기실입장: Grey/0 바탕, 모서리 6, 여백 16·18·12, 높이 88
            이름 줄 26(Title2 Grey/8 + "대기" 배지 60×26) / 4 / 정보 줄 30(Body2 Grey/5) */}
        <div className="flex flex-col gap-1 rounded-md bg-grey-0 px-4.5 pt-4 pb-3">
          <div className="flex h-6.5 items-center justify-between gap-1.5">
            <span className="truncate text-title2 text-grey-8">{preview.data.name}</span>
            <span className="flex h-6.5 w-15 shrink-0 items-center justify-center rounded-md border border-grey-2 bg-white text-body2 text-grey-6">
              대기
            </span>
          </div>
          <p className="flex h-7.5 items-center text-body2 text-grey-5">
            상장 완료 {preview.data.listedCount}명
          </p>
        </div>
        {/* 시안: 왼쪽 정렬 "←" + 4 + 문구, Body2 Grey/5 */}
        <button
          type="button"
          className="flex items-center gap-1 self-start text-body2 text-grey-5"
          onClick={() => handleCodeChange('')}
        >
          <span aria-hidden="true">←</span>
          초대 코드 다시 입력하기
        </button>
      </FormSection>
    );
  };

  const isConfirmStep = isCodeComplete && preview.isSuccess;

  return (
    <>
      <TaskHeader title="코드로 참여하기" />
      {/* 시안 'Join League Content': 위 8. 섹션 → "또는 새 리그 만들기"(떠 있지 않음) → 떠 있는 입장 버튼 */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2">
        {isConfirmStep ? renderConfirmStep() : renderCodeStep()}
        {/* 작업형 화면끼리 전환: 오버레이 내용만 바꾼다 (기록은 그대로) */}
        <div className="px-4.5">
          <Button
            variant="link"
            className="w-full"
            onClick={() => openOverlay({ type: 'leagueCreate' })}
          >
            또는 새 리그 만들기
          </Button>
        </div>
        {isConfirmStep && (
          <FloatingFooter className="px-4.5">
            <Button
              className="w-full"
              disabled={Boolean(joinErrorMessage)}
              isPending={join.isPending}
              pendingLabel="입장 중..."
              onClick={() => join.mutate({ inviteCode })}
            >
              대기실 입장하기
            </Button>
          </FloatingFooter>
        )}
      </main>
    </>
  );
}

export default LeagueJoinOverlay;
