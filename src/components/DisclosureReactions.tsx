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
function DisclosureReactions({
  roomId,
  disclosureId,
  myReaction,
  bullishCount,
  bearishCount,
}: DisclosureReactionsProps) {
  const queryClient = useQueryClient();
  const counts = { BULLISH: bullishCount, BEARISH: bearishCount };

  const { mutate, isPending } = useMutation({
    mutationFn: (reaction: Reaction | null) =>
      reactToDisclosure(roomId, disclosureId, { reaction }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(roomId, disclosureId) });
      queryClient.invalidateQueries({ queryKey: feedKeys.room(roomId) });
    },
    // 설계서는 공시 상세만 "반영", 피드는 "반응"이라 오타로 보고 "반응"으로 통일 (기획 확인 목록)
    meta: { action: '반응' },
  });

  return (
    <>
      {REACTIONS.map(({ reaction, label, Icon }) => (
        <button
          key={reaction}
          type="button"
          aria-pressed={myReaction === reaction}
          disabled={isPending}
          className={cn(
            'flex items-center gap-1 rounded-full border px-2 py-0.5',
            myReaction === reaction && 'border-gray-900 font-bold text-gray-900',
          )}
          onClick={() => mutate(myReaction === reaction ? null : reaction)}
        >
          <Icon className="size-3.5" />
          {label} {counts[reaction]}
        </button>
      ))}
    </>
  );
}

export default DisclosureReactions;
