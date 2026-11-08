import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomKeys, roomQueries } from '@/apis/domains/room/room.queries';
import type { ListedStock, RoomId } from '@/apis/domains/room/room.types';
import { listMyStock, updateMyStock } from '@/apis/domains/stock/stock.service';
import type { ListStockRequest, StockErrorCode } from '@/apis/domains/stock/stock.types';
import {
  isStockFormFilled,
  validateStockForm,
  type StockFormErrors,
} from '@/apis/domains/stock/stock.validation';
import LoadError from '@/components/LoadError';
import StockListingFields from '@/components/StockListingFields';
import TaskHeader from '@/components/TaskHeader';
import { useCloseOverlay } from '@/hooks/useOverlay';
import { getApiErrorCode } from '@/libs/apiError';

interface StockListingOverlayProps {
  roomId: RoomId;
}

interface StockListingFormProps extends StockListingOverlayProps {
  /** 이미 상장한 종목. 있으면 수정 */
  listedStock: ListedStock | null;
}

function StockListingForm({ roomId, listedStock }: StockListingFormProps) {
  const queryClient = useQueryClient();
  const closeOverlay = useCloseOverlay();
  const isEdit = listedStock !== null;
  const [stock, setStock] = useState<ListStockRequest>({
    name: listedStock?.name ?? '',
    description: listedStock?.description ?? '',
  });
  const [errors, setErrors] = useState<StockFormErrors>({});

  const { mutate, isPending } = useMutation({
    mutationFn: (request: ListStockRequest) =>
      isEdit ? updateMyStock(roomId, request) : listMyStock(roomId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.waiting(roomId) });
      queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
      closeOverlay();
    },
    // 이름 중복은 입력칸 위에 안내하고, 그 밖의 실패는 공통 토스트 "생성" (종목 상장 2, 수정일 때도 같음)
    meta: {
      action: '생성',
      handledErrors: ['STOCK_NAME_DUPLICATED'] satisfies StockErrorCode[],
    },
    onError: (error) => {
      if ((getApiErrorCode(error) as StockErrorCode | undefined) === 'STOCK_NAME_DUPLICATED') {
        setErrors({ name: '이미 존재하는 종목 이름이에요.' });
      }
    },
  });

  const handleSubmit = () => {
    const result = validateStockForm(stock);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    mutate({ name: stock.name.trim(), description: stock.description.trim() });
  };

  return (
    <>
      <TaskHeader
        title="종목 상장"
        action={
          <button
            type="button"
            className="font-bold disabled:text-gray-300"
            disabled={!isStockFormFilled(stock) || isPending}
            aria-busy={isPending || undefined}
            onClick={handleSubmit}
          >
            {/* 처음 상장이든 수정이든 버튼은 '상장' (종목 상장 2) */}
            상장
          </button>
        }
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-9 py-4">
        <h2 className="text-lg font-bold">나의 종목을 상장해 주세요.</h2>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          리그 기간 동안 친구들이 사고팔 나의 주식이에요.
        </p>
        <StockListingFields
          value={stock}
          errors={errors}
          onChange={(next) => {
            setStock(next);
            setErrors({});
          }}
        />
      </main>
    </>
  );
}

// 종목 상장 (오버레이, 대기실의 '내 종목 상장하기' / '내 종목 수정하기')
function StockListingOverlay({ roomId }: StockListingOverlayProps) {
  const { data: waitingRoom, isPending, isError, refetch } = useQuery(roomQueries.waiting(roomId));

  if (isPending || isError) {
    return (
      <>
        <TaskHeader title="종목 상장" />
        {isPending ? (
          <div className="mx-9 mt-4 h-40 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <LoadError onRetry={() => refetch()} />
        )}
      </>
    );
  }

  const myStock = waitingRoom.members.find((member) => member.isMe)?.stock ?? null;
  return <StockListingForm roomId={roomId} listedStock={myStock} />;
}

export default StockListingOverlay;
