import { useRef, useState } from 'react';
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { disclosureKeys } from '@/apis/domains/disclosure/disclosure.queries';
import {
  DISCLOSURE_ERROR_CODE,
  type DisclosureDetail,
  type DisclosureId,
  type Reaction,
} from '@/apis/domains/disclosure/disclosure.types';
import { feedKeys } from '@/apis/domains/feed/feed.queries';
import {
  toggleDisclosureReaction,
  type DisclosureReactionResult,
} from '@/apis/domains/feed/feed.service';
import type { FeedResponse } from '@/apis/domains/feed/feed.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import { getApiErrorCode } from '@/libs/apiError';
import { cn } from '@/utils/cn';
import { ThumbDownIcon, ThumbUpIcon } from '@/components/ui/icons';

interface DisclosureReactionsProps {
  roomId: RoomId;
  stockId: StockId;
  disclosureId: DisclosureId;
  myReaction: Reaction | null;
  bullishCount: number;
  bearishCount: number;
}

// 안 누른 상태는 Grey/5 글자·아이콘, 누른 상태는 시안 색(호재 파랑 NSSell, 악재 빨강 NSBuy) (디자이너 확인)
const REACTIONS = [
  {
    reaction: 'BULLISH',
    label: '호재',
    Icon: ThumbUpIcon,
    pressedClass: 'text-ns-sell',
  },
  {
    reaction: 'BEARISH',
    label: '악재',
    Icon: ThumbDownIcon,
    pressedClass: 'text-ns-buy',
  },
] as const;

// 공시 호재/악재 반응 (화면설계서 피드 1, 공시 상세 4). 피드 카드·종목 정보 카드·공시 상세에서 같이 쓴다
// 안 누른 반응 → 등록, 누른 반응 → 취소, 반대 반응을 누르면 바꾼다. 실패하면 "반응" 토스트 (libs/queryClient)
// 누르는 즉시 결과를 보여준다(낙관적 업데이트). 버튼을 잠그면 이어 누른 터치가 사라지므로 잠그지 않는다
// 대신 요청은 한 번에 하나만 보내고(중복 요청 방지), 진행 중에 또 누르면 끝난 뒤 마지막 선택만 맞춘다
// 서버는 누른 버튼으로 토글하므로, 마지막으로 받은 서버 반응에서 원하는 반응이 되도록 누를 버튼을 고른다
// 응답의 집계로 피드·종목 정보·공시 상세 캐시를 바로 고친다 (목록을 다시 받지 않는다). 실패하면 서버 값으로 되돌아간다
function DisclosureReactions({
  roomId,
  stockId,
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
    mutationFn: (pressed: Reaction) =>
      toggleDisclosureReaction(roomId, stockId, disclosureId, pressed),
    // 설계서는 공시 상세만 "반영", 피드는 "반응"이라 오타로 보고 "반응"으로 통일 (기획 확인 목록)
    meta: { action: '반응' },
  });

  const shownReaction = optimisticReaction === undefined ? myReaction : optimisticReaction;
  const getShownCount = (reaction: Reaction) =>
    counts[reaction] - Number(myReaction === reaction) + Number(shownReaction === reaction);

  // 토글 결과를 이 공시가 들어 있는 목록(리그 피드·종목 정보)과 공시 상세에 반영한다
  const applyResult = (result: DisclosureReactionResult) => {
    queryClient.setQueriesData<InfiniteData<FeedResponse>>(
      { queryKey: feedKeys.room(roomId) },
      (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.type === 'DISCLOSURE' && item.disclosureId === disclosureId
                ? { ...item, ...result }
                : item,
            ),
          })),
        },
    );
    queryClient.setQueryData<DisclosureDetail>(
      disclosureKeys.detail(roomId, disclosureId),
      (detail) => detail && { ...detail, ...result },
    );
  };

  const syncReaction = async () => {
    isSyncingRef.current = true;
    let serverReaction = myReaction;
    try {
      while (desiredReactionRef.current !== serverReaction) {
        // 원하는 반응이 없으면(취소) 지금 반응을 다시 눌러 끄고, 있으면 그 버튼을 누른다
        const pressed = desiredReactionRef.current ?? serverReaction;
        if (!pressed) break;
        const result = await mutateAsync(pressed);
        serverReaction = result.myReaction;
        applyResult(result);
      }
    } catch (error) {
      // 실패 안내는 "반응" 토스트로 처리된다 (libs/queryClient). 표시는 아래에서 서버 값으로 되돌린다
      // 그사이 공시가 지워졌으면 목록을 새로 받는다 (Swagger: 607 → 목록 새로고침)
      if (getApiErrorCode(error) === DISCLOSURE_ERROR_CODE.NOT_FOUND) {
        void queryClient.invalidateQueries({ queryKey: feedKeys.room(roomId) });
      }
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
      {REACTIONS.map(({ reaction, label, Icon, pressedClass }) => (
        <button
          key={reaction}
          type="button"
          aria-pressed={shownReaction === reaction}
          className={cn(
            // 시안: 높이 30, 안쪽 여백 4·8, 모서리 6, Grey/1 바탕, 아이콘 18 + 간격 2 + Button3
            // touch-manipulation: 더블탭 확대를 기다리느라 탭이 늦어지지 않게 한다
            'flex h-7.5 touch-manipulation items-center gap-0.5 rounded-md bg-grey-1 px-2 py-1 text-button3 text-grey-5',
            shownReaction === reaction && pressedClass,
          )}
          onClick={() => handleClick(reaction)}
        >
          <Icon />
          {label} {getShownCount(reaction)}
        </button>
      ))}
    </>
  );
}

export default DisclosureReactions;
