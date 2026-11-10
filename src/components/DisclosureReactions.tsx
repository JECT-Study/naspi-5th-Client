import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { disclosureKeys } from '@/apis/domains/disclosure/disclosure.queries';
import { reactToDisclosure } from '@/apis/domains/disclosure/disclosure.service';
import type { DisclosureId, Reaction } from '@/apis/domains/disclosure/disclosure.types';
import { feedKeys } from '@/apis/domains/feed/feed.queries';
import type { RoomId } from '@/apis/domains/room/room.types';
import { cn } from '@/utils/cn';
import { ThumbDownIcon, ThumbUpIcon } from './icons';

interface DisclosureReactionsProps {
  roomId: RoomId;
  disclosureId: DisclosureId;
  myReaction: Reaction | null;
  bullishCount: number;
  bearishCount: number;
}

const REACTIONS = [
  { reaction: 'BULLISH', label: '호재', Icon: ThumbUpIcon },
  { reaction: 'BEARISH', label: '악재', Icon: ThumbDownIcon },
] as const;

// 공시 호재/악재 반응 (화면설계서 피드 1, 공시 상세 4). 피드 카드·종목 정보 카드·공시 상세에서 같이 쓴다
// 안 누른 반응 → 등록, 누른 반응 → 취소, 반대 반응을 누르면 바꾼다. 실패하면 "반응" 토스트 (libs/queryClient)
// 누르는 즉시 결과를 보여준다(낙관적 업데이트). 버튼을 잠그면 이어 누른 터치가 사라지므로 잠그지 않는다
// 대신 요청은 한 번에 하나만 보내고(중복 요청 방지), 진행 중에 또 누르면 끝난 뒤 마지막 선택만 보낸다. 실패하면 서버 값으로 되돌아간다
function DisclosureReactions({
  roomId,
  disclosureId,
  myReaction,
  bullishCount,
  bearishCount,
}: DisclosureReactionsProps) {
  const queryClient = useQueryClient();
  const counts = { BULLISH: bullishCount, BEARISH: bearishCount };

  // undefined면 서버 값을 그대로 보여준다
  const [optimisticReaction, setOptimisticReaction] = useState<Reaction | null>();
  const desiredReactionRef = useRef<Reaction | null>(null);
  const isSyncingRef = useRef(false);

  const { mutateAsync } = useMutation({
    mutationFn: (reaction: Reaction | null) =>
      reactToDisclosure(roomId, disclosureId, { reaction }),
    // 설계서는 공시 상세만 "반영", 피드는 "반응"이라 오타로 보고 "반응"으로 통일 (기획 확인 목록)
    meta: { action: '반응' },
  });

  const shownReaction = optimisticReaction === undefined ? myReaction : optimisticReaction;
  const getShownCount = (reaction: Reaction) =>
    counts[reaction] - Number(myReaction === reaction) + Number(shownReaction === reaction);

  const syncReaction = async () => {
    isSyncingRef.current = true;
    try {
      let sentReaction: Reaction | null;
      do {
        sentReaction = desiredReactionRef.current;
        await mutateAsync(sentReaction);
        // 새 값을 받아 온 뒤에 표시를 풀어야 예전 값이 잠깐 보이지 않는다
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(roomId, disclosureId) }),
          queryClient.invalidateQueries({ queryKey: feedKeys.room(roomId) }),
        ]);
      } while (desiredReactionRef.current !== sentReaction);
    } catch {
      // 실패 안내는 "반응" 토스트로 처리된다 (libs/queryClient). 표시는 아래에서 서버 값으로 되돌린다
    } finally {
      isSyncingRef.current = false;
      setOptimisticReaction(undefined);
    }
  };

  const handleClick = (reaction: Reaction) => {
    const nextReaction = shownReaction === reaction ? null : reaction;
    desiredReactionRef.current = nextReaction;
    setOptimisticReaction(nextReaction);
    if (!isSyncingRef.current) void syncReaction();
  };

  return (
    <>
      {REACTIONS.map(({ reaction, label, Icon }) => (
        <button
          key={reaction}
          type="button"
          aria-pressed={shownReaction === reaction}
          className={cn(
            // touch-manipulation: 더블탭 확대를 기다리느라 탭이 늦어지지 않게 한다
            'flex touch-manipulation items-center gap-1 rounded-full border px-2 py-0.5',
            shownReaction === reaction && 'border-gray-900 font-bold text-gray-900',
          )}
          onClick={() => handleClick(reaction)}
        >
          <Icon className="size-3.5" />
          {label} {getShownCount(reaction)}
        </button>
      ))}
    </>
  );
}

export default DisclosureReactions;
