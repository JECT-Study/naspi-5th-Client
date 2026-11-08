import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockKeys } from '@/apis/domains/stock/stock.queries';
import { updateStockDescription } from '@/apis/domains/stock/stock.service';
import type { StockDetail } from '@/apis/domains/stock/stock.types';
import {
  STOCK_DESCRIPTION_COUNTER_FROM,
  STOCK_DESCRIPTION_MAX_LENGTH,
} from '@/apis/domains/stock/stock.validation';
import Button from '@/components/Button';
import { PencilIcon } from '@/components/icons';
import TextArea from '@/components/TextArea';
import { useRoomId } from '@/hooks/useRoomId';

interface StockIntroductionProps {
  stock: StockDetail;
}

// 종목 소개 (화면설계서 종목 정보 1). 내 종목이면 연필을 눌러 바로 고칠 수 있다 (종목 이름은 대기실에서만)
// 저장은 1자 이상일 때만, 실패하면 입력값을 둔 채 "저장" 토스트
// 설계서에는 저장 아이콘만 있지만, 저장 말고도 수정을 빠져나갈 수 있게 취소를 둔다 (사용자 결정 2026-11-08)
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

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-bold">종목 소개</h2>
        {stock.isMine && !isEditing && (
          <button
            type="button"
            aria-label="종목 소개 수정"
            onClick={() => setDraft(stock.description)}
          >
            <PencilIcon className="size-4" />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="mt-2 flex flex-col gap-2">
          <TextArea
            aria-label="종목 소개"
            value={draft}
            maxLength={STOCK_DESCRIPTION_MAX_LENGTH}
            counterFrom={STOCK_DESCRIPTION_COUNTER_FROM}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="h-9 text-sm"
              disabled={isPending}
              onClick={() => setDraft(null)}
            >
              취소
            </Button>
            <Button
              className="h-9 text-sm"
              disabled={draft.trim() === ''}
              isPending={isPending}
              onClick={() => mutate(draft.trim())}
            >
              저장
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm whitespace-pre-line text-gray-600">{stock.description}</p>
      )}
    </section>
  );
}

export default StockIntroduction;
