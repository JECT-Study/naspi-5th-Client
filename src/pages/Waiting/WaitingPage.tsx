import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { roomKeys, roomQueries } from '@/apis/domains/room/room.queries';
import { deleteRoom, kickMember, leaveRoom, startRoom } from '@/apis/domains/room/room.service';
import type { RoomErrorCode, WaitingMember } from '@/apis/domains/room/room.types';
import {
  MIN_MEMBERS_TO_START,
  getLeagueEndAt,
  groupWaitingMembers,
} from '@/apis/domains/room/room.utils';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import Dropdown from '@/components/Dropdown';
import FloatingFooter from '@/components/FloatingFooter';
import { MoreIcon } from '@/components/icons';
import LeagueHeader from '@/components/LeagueHeader';
import LoadError from '@/components/LoadError';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { useRoomId } from '@/hooks/useRoomId';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';
import { formatKstDateTime, getDaysUntil } from '@/utils/date';
import InviteCodeSection from './components/InviteCodeSection';
import MemberRow from './components/MemberRow';
import RoomNameEditModal from './components/RoomNameEditModal';

type WaitingModal =
  | { type: 'rename' }
  | { type: 'delete' }
  | { type: 'leave' }
  | { type: 'kick'; member: WaitingMember }
  | { type: 'start' };

const ROOM_DELETED_MESSAGE = '리그가 삭제되었어요.';

// 만료 배너는 만료 2일 전부터 보여준다 (화면설계서 대기실 10)
const EXPIRY_BANNER_DAYS = 2;

const formatExpiry = (days: number) => {
  if (days <= 0) return '오늘';
  if (days === 1) return '내일';
  return `${days}일 뒤`;
};

// 대기실 (화면설계서 대기실). 역할: 방장 / 참여자(상장 완료) / 대기자(아직 상장 전)
// - 상단 메뉴: 방장만 (리그 이름 수정, 리그 삭제)
// - 내 종목 메뉴: 방장·참여자 (내 종목 수정하기, 리그 나가기)
// - 대기자는 내 종목 영역 없이 대기 중인 친구에 내 이름이 나오고, 그 메뉴로 상장·나가기
// - 친구 메뉴: 방장만, 상장한 친구·대기 중인 친구 모두 (내보내기)
// - 하단: 방장 리그 시작하기 (참여자 3명 이상일 때 활성화), 참여자 내 종목 수정하기, 대기자 내 종목 상장하기
function WaitingPage() {
  const roomId = useRoomId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: room, isPending, isError, refetch } = useQuery(roomQueries.waiting(roomId));
  const [modal, setModal] = useState<WaitingModal | null>(null);
  const closeModal = () => setModal(null);
  // 종목 상장은 대기실 위에 오버레이로 연다
  const openOverlay = useOpenOverlay();
  const openListing = () => openOverlay({ type: 'stockListing', roomId });

  const invalidateRoom = () => {
    queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
    queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
  };

  // 대기실이 사라지거나 내가 나간 뒤에는 완료 토스트를 띄우고 메인으로 가며, 이 대기실 캐시를 지운다 (대기실 1-3-1, 4-2-1)
  const exitToMain = (message: string) => {
    notify.success(message);
    navigate('/leagues', { replace: true });
    queryClient.removeQueries({ queryKey: roomKeys.room(roomId) });
    queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
  };

  // 대기자가 있으면 시작하지 않고 안내만 한다 (화면설계서 대기실 7-2)
  const notifyWaitingMembers = () => {
    closeModal();
    notify.error('아직 대기 중인 친구가 있어요.');
  };

  // 실패하면 공통 토스트 (libs/queryClient)
  const deleteMutation = useMutation({
    mutationFn: () => deleteRoom(roomId),
    onSuccess: () => exitToMain(ROOM_DELETED_MESSAGE),
    meta: { action: '삭제' },
  });
  // 방장이 혼자 나가면 대기실이 사라지므로 완료 문구가 다르다. 누를 때 문구를 넘겨받는다
  const leaveMutation = useMutation({
    mutationFn: (_successMessage: string) => leaveRoom(roomId),
    onSuccess: (_data, successMessage) => exitToMain(successMessage),
    meta: { action: '퇴장' },
  });
  const kickMutation = useMutation({
    mutationFn: (member: WaitingMember) => kickMember(roomId, member.userId),
    onSuccess: () => {
      invalidateRoom();
      closeModal();
    },
    meta: { action: '내보내기' },
  });
  const startMutation = useMutation({
    mutationFn: () => startRoom(roomId),
    // 시작 완료 토스트를 띄우고 리그 피드로 간다 (대기실 7-1-1)
    onSuccess: () => {
      closeModal();
      invalidateRoom();
      notify.success('리그가 시작되었어요.');
      navigate(`/leagues/${roomId}`, { replace: true });
    },
    meta: {
      action: '리그 시작',
      handledErrors: ['WAITING_MEMBER_EXISTS'] satisfies RoomErrorCode[],
    },
    onError: (error) => {
      // 확인하는 사이 다른 친구가 들어온 경우
      if ((getApiErrorCode(error) as RoomErrorCode | undefined) === 'WAITING_MEMBER_EXISTS') {
        notifyWaitingMembers();
        invalidateRoom();
      }
    },
  });

  if (isPending || isError) {
    return (
      <>
        <LeagueHeader leagueName="" badge="대기" />
        {isPending ? (
          <div className="mx-9 mt-4 h-40 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <LoadError onRetry={() => refetch()} />
        )}
      </>
    );
  }

  const { me, listedFriends, waitingFriends } = groupWaitingMembers(room.members);
  const isHost = me?.isHost ?? false;
  const myStock = me?.stock ?? null;
  // 상장된 종목 현황: 방장·참여자·대기자를 합한 인원 중 상장을 마친 인원
  const listedCount = room.members.filter((member) => member.stock).length;
  const daysUntilExpiry = getDaysUntil(new Date(room.expiresAt));
  // 대기자인 나는 대기 중인 친구 맨 앞에 나온다
  const waitingMembers = me && !myStock ? [me, ...waitingFriends] : waitingFriends;

  const openLeaveModal = () => setModal({ type: 'leave' });
  const headerMenu = [
    { label: '리그 이름 수정', onSelect: () => setModal({ type: 'rename' }) },
    { label: '리그 삭제', onSelect: () => setModal({ type: 'delete' }) },
  ];
  const myStockActions = [
    { label: '내 종목 수정하기', onSelect: openListing },
    { label: '리그 나가기', onSelect: openLeaveModal },
  ];
  const myWaitingActions = [
    { label: '내 종목 상장하기', onSelect: openListing },
    { label: '리그 나가기', onSelect: openLeaveModal },
  ];
  const getMemberActions = (member: WaitingMember) => {
    if (member.isMe) return myWaitingActions;
    return isHost
      ? [{ label: '내보내기', onSelect: () => setModal({ type: 'kick', member }) }]
      : [];
  };

  // 방장이 나가는데 상장한 친구가 없으면 대기실이 사라진다 (대기실 4-3)
  const isLeaveDeletingRoom = isHost && listedFriends.length === 0;

  const getLeaveDescription = () => {
    if (isLeaveDeletingRoom) return '나가면 대기실이 사라져요.';
    if (isHost) return '가장 먼저 상장한 친구에게 방장 권한이 넘어가요.';
    return myStock ? '이 리그의 참여가 취소돼요.' : '이 리그의 대기가 취소돼요.';
  };

  // 시작하기를 눌렀을 때 대기자가 있으면 시작하지 않는다. 서버도 한 번 더 확인한다 (WAITING_MEMBER_EXISTS)
  const handleStartConfirm = () => {
    if (waitingFriends.length > 0) {
      notifyWaitingMembers();
      return;
    }
    startMutation.mutate();
  };

  return (
    <>
      <LeagueHeader
        leagueName={room.name}
        badge="대기"
        menu={
          isHost && (
            <Dropdown
              label="대기실 메뉴"
              icon={<MoreIcon className="size-5" />}
              items={headerMenu}
            />
          )
        }
      />
      <main className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-9 pt-4">
        {daysUntilExpiry <= EXPIRY_BANNER_DAYS && (
          <p className="rounded-lg bg-gray-100 px-4 py-2 text-center text-sm">
            대기실이 {formatExpiry(daysUntilExpiry)} 사라져요. 그 전에 리그를 시작해 주세요.
          </p>
        )}

        <InviteCodeSection leagueName={room.name} inviteCode={room.inviteCode} />

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">상장된 종목</h2>
            <span className="text-sm text-gray-500">
              {listedCount}/{room.members.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            모든 친구가 상장을 완료하면, 방장이 리그를 시작할 수 있어요.
          </p>
          {me?.stock && (
            <div className="mt-4">
              <h3 className="text-sm text-gray-500">내 종목</h3>
              <MemberRow member={me} actions={myStockActions} />
            </div>
          )}
          {listedFriends.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm text-gray-500">친구 종목</h3>
              <ul>
                {listedFriends.map((member) => (
                  <li key={member.userId}>
                    <MemberRow member={member} actions={getMemberActions(member)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {waitingMembers.length > 0 && (
          <section>
            <h2 className="text-sm text-gray-500">대기 중인 친구</h2>
            <ul>
              {waitingMembers.map((member) => (
                <li key={member.userId}>
                  <MemberRow member={member} actions={getMemberActions(member)} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <FloatingFooter>
          {/* 방장 포함 참여자(상장 완료)가 3명 이상이어야 누를 수 있다 */}
          {isHost && (
            <Button
              className="w-full"
              disabled={listedCount < MIN_MEMBERS_TO_START}
              onClick={() => setModal({ type: 'start' })}
            >
              리그 시작하기
            </Button>
          )}
          {!isHost && myStock && (
            <Button variant="secondary" className="w-full" onClick={openListing}>
              내 종목 수정하기
            </Button>
          )}
          {!isHost && !myStock && (
            <Button className="w-full" onClick={openListing}>
              내 종목 상장하기
            </Button>
          )}
        </FloatingFooter>
      </main>

      {modal?.type === 'rename' && (
        <RoomNameEditModal roomId={roomId} currentName={room.name} onClose={closeModal} />
      )}
      {modal?.type === 'delete' && (
        <ConfirmModal
          title="대기실을 삭제할까요?"
          description="모든 친구의 참여가 취소되고, 대기실이 사라져요."
          confirmLabel="삭제하기"
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={closeModal}
        />
      )}
      {modal?.type === 'leave' && (
        <ConfirmModal
          title="대기실에서 나갈까요?"
          description={getLeaveDescription()}
          confirmLabel="나가기"
          isPending={leaveMutation.isPending}
          onConfirm={() =>
            leaveMutation.mutate(
              isLeaveDeletingRoom ? ROOM_DELETED_MESSAGE : '리그에서 퇴장했어요.',
            )
          }
          onCancel={closeModal}
        />
      )}
      {modal?.type === 'kick' && (
        <ConfirmModal
          title={`${modal.member.name}님을 내보낼까요?`}
          confirmLabel="내보내기"
          isPending={kickMutation.isPending}
          onConfirm={() => kickMutation.mutate(modal.member)}
          onCancel={closeModal}
        />
      )}
      {modal?.type === 'start' && (
        <ConfirmModal
          title={`${room.name} 리그를 시작할까요?`}
          description={`참여자 ${listedCount}명\n${formatKstDateTime(getLeagueEndAt(new Date()))} 종료 예정`}
          confirmLabel="시작하기"
          isPending={startMutation.isPending}
          onConfirm={handleStartConfirm}
          onCancel={closeModal}
        />
      )}
    </>
  );
}

export default WaitingPage;
