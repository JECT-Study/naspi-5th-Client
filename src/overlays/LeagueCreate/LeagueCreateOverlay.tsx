import { useState, type KeyboardEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { roomKeys } from '@/apis/domains/room/room.queries';
import { createRoom } from '@/apis/domains/room/room.service';
import type { RoomErrorCode } from '@/apis/domains/room/room.types';
import { ACTIVE_ROOM_LIMIT_MESSAGE } from '@/apis/domains/room/room.utils';
import { ROOM_NAME_MAX_LENGTH } from '@/apis/domains/room/room.validation';
import type { ListStockRequest } from '@/apis/domains/stock/stock.types';
import {
  isStockFormFilled,
  validateStockForm,
  type StockFormErrors,
} from '@/apis/domains/stock/stock.validation';
import Button from '@/components/ui/Button';
import FloatingFooter from '@/components/ui/FloatingFooter';
import StockListingFields from '@/components/stock/StockListingFields';
import TaskHeader from '@/components/header/TaskHeader';
import TextField from '@/components/ui/TextField';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';

// 시안 섹션 (리그 이름 입력 섹션, 내 종목 상장 섹션): 여백 위 20·좌우 24·아래 16, 안내와 입력 사이 16
const SECTION_CLASS = 'flex flex-col gap-4 px-6 pt-5 pb-4';

// 섹션 안내: 제목 Title3 Grey/8, 4 띄우고 설명 Body2.5 Grey/6
function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-title3 text-grey-8">{title}</h2>
      <p className="text-body2-5 text-grey-6">{description}</p>
    </div>
  );
}

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
        notify.error(ACTIVE_ROOM_LIMIT_MESSAGE);
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
      {/* 시안 '새 리그 생성 콘텐츠': 위 8. 섹션은 여백 20·24·16, 안내와 입력 사이 16 */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2">
        <section className={SECTION_CLASS}>
          <SectionIntro
            title="리그 이름을 입력해 주세요."
            description="방장은 리그 시작 전 대기실에서 리그 이름을 변경할 수 있어요."
          />
          <TextField
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
          <section className={SECTION_CLASS}>
            <SectionIntro
              title="나의 종목을 상장해 주세요."
              description="리그 기간 동안 친구들이 사고팔 나의 주식이에요."
            />
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

        {/* 시안: 떠 있지 않고 마지막 섹션 바로 아래 (좌우 18, 폭 324)
            작업형 화면끼리 전환: 오버레이 내용만 바꾼다 (기록은 그대로) */}
        <div className="px-4.5">
          <Button
            variant="link"
            className="w-full"
            onClick={() => openOverlay({ type: 'leagueJoin' })}
          >
            또는 코드로 참여하기
          </Button>
        </div>

        {isListingVisible && (
          <FloatingFooter className="px-4.5">
            <Button
              className="w-full"
              disabled={!canSubmit}
              isPending={isPending}
              pendingLabel="생성 중..."
              onClick={handleSubmit}
            >
              대기실 생성하기
            </Button>
          </FloatingFooter>
        )}
      </main>
    </>
  );
}

export default LeagueCreateOverlay;
