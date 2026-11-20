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
import LoadError from '@/components/status/LoadError';
import FormSection from '@/components/ui/FormSection';
import StockListingFields from '@/components/stock/StockListingFields';
import TaskHeader from '@/components/header/TaskHeader';
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
        // 처음 상장이든 수정이든 버튼은 '상장' (종목 상장 2)
        action={{
          label: '상장',
          disabled: !isStockFormFilled(stock),
          isPending,
          onClick: handleSubmit,
        }}
      />
      {/* 시안 '종목 상장 콘텐츠': 위아래 8 안에 새 리그와 같은 '내 종목 상장 섹션' */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
        <FormSection
          title="나의 종목을 상장해 주세요."
          description="리그 기간 동안 친구들이 사고팔 나의 주식이에요."
        >
          <StockListingFields
            value={stock}
            errors={errors}
            onChange={(next) => {
              setStock(next);
              setErrors({});
            }}
          />
        </FormSection>
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
          // 임시 자리 표시 (스켈레톤 시안 작업 중, 나오면 교체): 실제 미리보기 상자 자리(위에서 88, 높이 80)
          <div className="px-6 pt-22">
            <div className="h-20 animate-pulse rounded-md bg-grey-0" />
          </div>
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
