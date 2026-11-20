import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockKeys } from '@/apis/domains/stock/stock.queries';
import { updateStockDescription } from '@/apis/domains/stock/stock.service';
import type { StockDetail } from '@/apis/domains/stock/stock.types';
import { STOCK_DESCRIPTION_MAX_LENGTH } from '@/apis/domains/stock/stock.validation';
import { PencilIcon } from '@/components/ui/icons';
import TextArea from '@/components/ui/TextArea';
import { useRoomId } from '@/hooks/useRoomId';

// 드로어 이름 수정과 같은 글자 버튼. 누를 수 없을 때(공란, 저장 중)는 Grey/4
const TEXT_BUTTON_CLASS = 'text-button3 text-grey-5 disabled:text-grey-4';

interface StockIntroductionProps {
  stock: StockDetail;
}

// 종목 소개 (화면설계서 종목 정보 1). 내 종목이면 연필을 눌러 바로 고칠 수 있다 (종목 이름은 대기실에서만)
// 저장은 1자 이상일 때만, 실패하면 입력값을 둔 채 "저장" 토스트
// 설계서에는 저장 아이콘만 있지만, 저장 말고도 수정을 빠져나갈 수 있게 취소를 둔다 (사용자 결정 2026-11-08, 시안도 취소·저장)
function StockIntroduction({ stock }: StockIntroductionProps) {
  const roomId = useRoomId();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const isEditing = draft !== null;

  const { mutate, isPending } = useMutation({
    mutationFn: (description: string) =>
      updateStockDescription(roomId, stock.stockId, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.room(roomId) });
      setDraft(null);
    },
    meta: { action: '저장' },
  });

  // 시안 '종목 소개 영역': 흰색, 여백 16·20, 제목 줄과 내용 사이 2
  // - 제목 줄(높이 25): "종목 소개" Title1 Grey/8 + 오른쪽 연필(Edit 18 Grey/8) 또는 수정 중 "취소"·"저장"(Button3 Grey/5, 사이 6)
  // - 내용: Body2.5 Grey/8 / 수정 중: 종목 소개 입력칸(글자 수 표시 포함)
  return (
    <section className="flex flex-col gap-0.5 bg-white px-5 py-4">
      <div className="flex h-6.25 items-center justify-between gap-0.5">
        <h2 className="text-title1 text-grey-8">종목 소개</h2>
        {stock.isMine && !isEditing && (
          <button
            type="button"
            aria-label="종목 소개 수정"
            onClick={() => setDraft(stock.description)}
          >
            <PencilIcon className="text-grey-8" />
          </button>
        )}
        {isEditing && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={TEXT_BUTTON_CLASS}
              disabled={isPending}
              onClick={() => setDraft(null)}
            >
              취소
            </button>
            <button
              type="button"
              className={TEXT_BUTTON_CLASS}
              disabled={draft.trim() === '' || isPending}
              aria-busy={isPending || undefined}
              onClick={() => mutate(draft.trim())}
            >
              저장
            </button>
          </div>
        )}
      </div>
      {isEditing ? (
        <TextArea
          aria-label="종목 소개"
          value={draft}
          maxLength={STOCK_DESCRIPTION_MAX_LENGTH}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : (
        <p className="text-body2-5 wrap-break-word whitespace-pre-line text-grey-8">
          {stock.description}
        </p>
      )}
    </section>
  );
}

export default StockIntroduction;
