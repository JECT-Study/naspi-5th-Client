import { useState, type KeyboardEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { roomKeys } from '@/apis/domains/room/room.queries';
import { createRoom } from '@/apis/domains/room/room.service';
import type { RoomErrorCode } from '@/apis/domains/room/room.types';
import { MAX_ACTIVE_ROOMS } from '@/apis/domains/room/room.utils';
import { ROOM_NAME_MAX_LENGTH } from '@/apis/domains/room/room.validation';
import type { ListStockRequest } from '@/apis/domains/stock/stock.types';
import {
  isStockFormFilled,
  validateStockForm,
  type StockFormErrors,
} from '@/apis/domains/stock/stock.validation';
import Button from '@/components/Button';
import FloatingFooter, { FLOATING_FOOTER_SPACE_TALL } from '@/components/FloatingFooter';
import StockListingFields from '@/components/StockListingFields';
import TaskHeader from '@/components/TaskHeader';
import TextField from '@/components/TextField';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';
import { cn } from '@/utils/cn';

// 새 리그 (오버레이): 리그 이름 → (입력을 마치면) 방장 종목 상장 → 대기실 생성
// 서비스 정책 2.1: 방장이 상장해야 생성 완료
function LeagueCreateOverlay() {
  const navigate = useNavigate();
  const openOverlay = useOpenOverlay();
  const queryClient = useQueryClient();
  const [leagueName, setLeagueName] = useState('');
  const [isListingVisible, setIsListingVisible] = useState(false);
  const [stock, setStock] = useState<ListStockRequest>({ name: '', description: '' });
  const [stockErrors, setStockErrors] = useState<StockFormErrors>({});

  const { mutate, isPending } = useMutation({
    mutationFn: createRoom,
    onSuccess: ({ roomId }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
      // 오버레이 기록을 대기실로 바꿔치기한다 (오버레이는 닫히고, 뒤로 가기를 누르면 열기 전 화면)
      navigate(`/leagues/${roomId}/waiting`, { replace: true });
    },
    // 리그 수 제한은 전용 문구로, 그 밖의 실패는 공통 토스트 (libs/queryClient)
    meta: {
      action: '생성',
      handledErrors: ['ACTIVE_ROOM_LIMIT_EXCEEDED'] satisfies RoomErrorCode[],
    },
    onError: (error) => {
      if ((getApiErrorCode(error) as RoomErrorCode | undefined) === 'ACTIVE_ROOM_LIMIT_EXCEEDED') {
        notify.error(`리그는 동시에 ${MAX_ACTIVE_ROOMS}개까지만 진행할 수 있어요.`);
      }
    },
  });

  // 리그 이름 입력을 마치면(Enter, 다른 곳 누르기) 종목 상장 영역을 이어서 보여준다
  const showListing = () => {
    if (leagueName.trim()) setIsListingVisible(true);
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) showListing();
  };

  const handleSubmit = () => {
    const { isValid, errors } = validateStockForm(stock);
    if (!isValid) {
      setStockErrors(errors);
      return;
    }
    mutate({
      name: leagueName.trim(),
      stock: { name: stock.name.trim(), description: stock.description.trim() },
    });
  };

  const canSubmit = leagueName.trim() !== '' && isStockFormFilled(stock);

  return (
    <>
      <TaskHeader title="새 리그" />
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto px-9 pt-4',
          FLOATING_FOOTER_SPACE_TALL,
        )}
      >
        <section>
          <h2 className="text-lg font-bold">리그 이름을 입력해 주세요.</h2>
          <p className="mt-1 text-sm text-gray-500">
            방장은 리그 시작 전 대기실에서 리그 이름을 변경할 수 있어요.
          </p>
          <TextField
            className="mt-4"
            aria-label="리그 이름"
            placeholder="리그 이름을 입력해 주세요."
            value={leagueName}
            maxLength={ROOM_NAME_MAX_LENGTH}
            autoFocus
            onChange={(event) => setLeagueName(event.target.value)}
            onBlur={showListing}
            onKeyDown={handleNameKeyDown}
          />
        </section>

        {isListingVisible && (
          <section>
            <h2 className="text-lg font-bold">나의 종목을 상장해 주세요.</h2>
            <p className="mt-1 mb-4 text-sm text-gray-500">
              리그 기간 동안 친구들이 사고팔 나의 주식이에요.
            </p>
            <StockListingFields
              value={stock}
              errors={stockErrors}
              onChange={(next) => {
                setStock(next);
                setStockErrors({});
              }}
            />
          </section>
        )}
      </main>
      <FloatingFooter>
        <div className="flex flex-col items-center gap-3">
          {isListingVisible && (
            <Button
              className="w-full"
              disabled={!canSubmit}
              isPending={isPending}
              pendingLabel="생성 중..."
              onClick={handleSubmit}
            >
              대기실 생성하기
            </Button>
          )}
          {/* 작업형 화면끼리 전환: 오버레이 내용만 바꾼다 (기록은 그대로) */}
          <button
            type="button"
            className="text-xs text-gray-500 underline"
            onClick={() => openOverlay({ type: 'leagueJoin' })}
          >
            또는 코드로 참여하기
          </button>
        </div>
      </FloatingFooter>
    </>
  );
}

export default LeagueCreateOverlay;
