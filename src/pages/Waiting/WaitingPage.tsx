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
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/overlay/ConfirmModal';
import FieldMessage from '@/components/ui/FieldMessage';
import FloatingFooter from '@/components/ui/FloatingFooter';
import LeagueHeader from '@/components/header/LeagueHeader';
import LoadError from '@/components/status/LoadError';
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

const ROOM_DELETED_MESSAGE = '대기실을 삭제했어요.';

// 만료 배너는 만료 2일 전부터 보여준다 (화면설계서 대기실 9)
const EXPIRY_BANNER_DAYS = 2;

// 당일이거나 그보다 지난 경우(설계서: 당일 + 최대 1일 추가)는 "오늘"
const formatExpiry = (days: number) => {
  if (days <= 0) return '오늘';
  if (days === 1) return '내일';
  return `${days}일 뒤`;
};

// 대기실 (화면설계서 대기실, v.1.7). 역할: 방장 / 참여자(상장 완료) / 대기자(아직 상장 전)
// - 상단 메뉴(1): 모두에게 보인다. 방장은 리그 이름 수정·대기실 나가기·대기실 삭제(1-1), 참여자·대기자는 대기실 나가기(1-4)
// - 내 종목 메뉴(4): 방장 본인 종목에만 (내 종목 수정하기). 참여자·대기자는 하단 버튼으로만 상장·수정한다
// - 친구 메뉴(5): 방장만, 상장한 친구·대기 중인 친구 모두 (내보내기)
// - 참여자 목록은 시안대로 한 상자에 상장 완료 → 상장 대기 순, 나는 내 상태 묶음 맨 앞 (대기자인 나는 메뉴 없음)
// - 하단: 방장 리그 시작하기 (참여자 3명 이상일 때 활성화), 참여자 내 종목 수정하기, 대기자 내 종목 상장하기
// - 리그 시작 전 삭제·나가기 문구에는 '대기실'을 쓴다 (설계서 v.1.5)
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

  // 대기실이 사라지거나 내가 나간 뒤에는 완료 토스트를 띄우고 메인으로 가며, 이 대기실 캐시를 지운다 (대기실 1-3-1, 1-1-2)
  const exitToMain = (message: string) => {
    notify.success(message);
    navigate('/leagues', { replace: true });
    queryClient.removeQueries({ queryKey: roomKeys.room(roomId) });
    queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
  };

  // 대기자가 있으면 시작하지 않고 안내만 한다 (화면설계서 대기실 6-2)
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
    // 시작 완료 토스트를 띄우고 리그 피드로 간다 (대기실 6-1-1)
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
        <LeagueHeader leagueName="" />
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
  // 시안 순서: 상장 완료한 사람 → 상장 대기인 사람. 나는 내 상태 묶음의 맨 앞 (시안에 내 줄 표시가 없어 정함)
  const orderedMembers = [
    ...(me && myStock ? [me] : []),
    ...listedFriends,
    ...(me && !myStock ? [me] : []),
    ...waitingFriends,
  ];

  const leaveAction = { label: '대기실 나가기', onSelect: () => setModal({ type: 'leave' }) };
  // 상단 메뉴: 방장 리그 드롭다운(1-1) / 참여자·대기자 일반 리그 드롭다운(1-4)
  const headerMenu = isHost
    ? [
        { label: '리그 이름 수정', onSelect: () => setModal({ type: 'rename' }) },
        leaveAction,
        { label: '대기실 삭제', onSelect: () => setModal({ type: 'delete' }) },
      ]
    : [leaveAction];
  // 내 종목 메뉴(4-1): 방장 본인 종목에만. 방장은 하단에 종목 수정 버튼이 없어서 여기서 수정한다
  const myStockActions =
    isHost && myStock ? [{ label: '내 종목 수정하기', onSelect: openListing }] : [];
  // 친구 메뉴(5-1): 방장만 내보내기. 내 줄(대기자인 나)에는 메뉴가 없다
  const getMemberActions = (member: WaitingMember) =>
    isHost && !member.isMe
      ? [{ label: '내보내기', onSelect: () => setModal({ type: 'kick', member }) }]
      : [];

  // 방장이 나가는데 상장한 친구가 없으면 대기실이 사라진다 (대기실 1-1-3)
  const isLeaveDeletingRoom = isHost && listedFriends.length === 0;

  // 방장 퇴장(1-1-1 인계O, 1-1-3 인계X), 참여자·대기자 퇴장(1-4-1, 같은 문구)
  const getLeaveDescription = () => {
    if (isLeaveDeletingRoom) return '나가면 대기실이 사라져요.';
    if (isHost) return '가장 먼저 상장한 친구에게 방장 권한이 넘어가요.';
    return '이 리그의 참여가 취소돼요.';
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
        // 상단 메뉴는 대기실 멤버 모두에게 보인다 (방장·참여자·대기자, 대기실 1)
        menu={me ? { label: '대기실 메뉴', items: headerMenu } : undefined}
      />
      {/* 시안 대기실: 위 8, 만료 배너 → 초대 코드 영역 → 리그 참여자 영역 (영역마다 안쪽 여백) */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2">
        {daysUntilExpiry <= EXPIRY_BANNER_DAYS && (
          // 시안 대기실 만료 안내 배너: 화면 폭 전체, SubBuy2 바탕, 여백 12·16, 안에 오류 문구(Notice 18 + 빨간 글자)
          <div className="bg-sub-buy-2 px-4 py-3">
            <FieldMessage>
              대기실이 {formatExpiry(daysUntilExpiry)} 사라져요. 그 전에 리그를 시작해 주세요.
            </FieldMessage>
          </div>
        )}

        <InviteCodeSection inviteCode={room.inviteCode} />

        {/* 시안 '리그 참여자 영역' (사용자 결정: 설계서의 내 종목·친구 종목·대기 중인 친구 대신 시안 구조)
            - 여백 20·24·16, 안내와 목록 사이 16
            - 안내: "리그 참여자" Title3 Grey/8 + 오른쪽 상장 현황 Title4 NSBlue, 4 띄우고 설명 Body2.5 Grey/6
            - 목록: 흰색 + Grey/2 테두리 상자(모서리 10, 여백 12·8), 줄 사이 8 */}
        <section className="flex flex-col gap-4 px-6 pt-5 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <h2 className="text-title3 text-grey-8">리그 참여자</h2>
              {/* 상장된 종목 현황 (대기실 3) */}
              <span className="text-title4 text-ns-blue">
                {listedCount}/{room.members.length}
              </span>
            </div>
            <p className="text-body2-5 text-grey-6">
              모든 친구가 상장을 완료하면, 방장이 리그를 시작할 수 있어요.
            </p>
          </div>
          <ul className="flex flex-col gap-2 rounded-[10px] border border-grey-2 bg-white px-2 py-3">
            {orderedMembers.map((member) => (
              <li key={member.userId}>
                <MemberRow
                  member={member}
                  actions={member.isMe ? myStockActions : getMemberActions(member)}
                />
              </li>
            ))}
          </ul>
        </section>
        <FloatingFooter className="px-4.5">
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
            <Button variant="secondary" className="w-full" onClick={openListing}>
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
              isLeaveDeletingRoom ? ROOM_DELETED_MESSAGE : '대기실에서 나왔어요.',
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
