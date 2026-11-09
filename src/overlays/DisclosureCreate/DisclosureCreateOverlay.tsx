import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker, useNavigate } from 'react-router';
import { createDisclosure } from '@/apis/domains/disclosure/disclosure.service';
import {
  DISCLOSURE_CONTENT_COUNTER_FROM,
  DISCLOSURE_CONTENT_MAX_LENGTH,
  DISCLOSURE_IMAGE_TYPES,
  DISCLOSURE_MAX_IMAGES,
  DISCLOSURE_TITLE_COUNTER_FROM,
  DISCLOSURE_TITLE_MAX_LENGTH,
  isDisclosureFilled,
  isDisclosureImage,
} from '@/apis/domains/disclosure/disclosure.validation';
import { feedKeys } from '@/apis/domains/feed/feed.queries';
import type { RoomId } from '@/apis/domains/room/room.types';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import CharCounter from '@/components/CharCounter';
import ConfirmModal from '@/components/ConfirmModal';
import { CameraIcon, ImageIcon } from '@/components/icons';
import StockAvatar from '@/components/StockAvatar';
import TaskHeader from '@/components/TaskHeader';
import { isForcedNavigation } from '@/hooks/useOverlay';
import { notify } from '@/libs/notify';
import ImageAttachments from './components/ImageAttachments';

interface DisclosureCreateOverlayProps {
  roomId: RoomId;
}

// 공시 쓰기 (오버레이): 내 종목에 제목(30자)·본문(300자)·이미지(최대 4장)를 게시한다 (서비스 정책 3.1)
// 작성 중에 닫으려 하면(X, 뒤로 가기 = 오버레이 기록 빼기) 그만둘지 묻는다
function DisclosureCreateOverlay({ roomId }: DisclosureCreateOverlayProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: stocks } = useQuery(stockQueries.list(roomId));
  const myStock = stocks?.find((stock) => stock.isMine);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // 게시에 성공해 나갈 때는 묻지 않는다
  const isPublishedRef = useRef(false);

  const hasDraft = title.trim() !== '' || content.trim() !== '' || images.length > 0;
  // 리그 시작·종료로 화면이 옮겨질 때는 묻지 않는다 (리그가 끝나면 작성도 끝)
  const blocker = useBlocker(
    ({ nextLocation }) => hasDraft && !isPublishedRef.current && !isForcedNavigation(nextLocation),
  );

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createDisclosure(roomId, { title: title.trim(), content: content.trim(), images }),
    // 게시하면 그 공시 상세로 간다 (공시 쓰기 2). 오버레이 기록을 상세로 바꿔서, 상세에서 뒤로 가면 원래 화면
    onSuccess: ({ disclosureId }) => {
      isPublishedRef.current = true;
      queryClient.invalidateQueries({ queryKey: feedKeys.room(roomId) });
      notify.success('공시가 게시되었어요.');
      navigate(`/leagues/${roomId}/disclosures/${disclosureId}`, { replace: true });
    },
    // 실패하면 작성한 내용을 그대로 두고 공통 토스트 (libs/queryClient)
    meta: { action: '게시' },
  });

  // 사진 개수 초과(4-2)·형식 오류(4-3)는 토스트로 알린다
  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // 같은 파일을 다시 고를 수 있게 비운다
    event.target.value = '';
    if (files.length === 0) return;

    if (images.length + files.length > DISCLOSURE_MAX_IMAGES) {
      notify.error(`최대 ${DISCLOSURE_MAX_IMAGES}장의 사진까지 업로드 할 수 있어요.`);
      return;
    }
    if (!files.every(isDisclosureImage)) {
      notify.error('이미지를 업로드하지 못했어요.');
      return;
    }
    setImages((prev) => [...prev, ...files]);
  };

  return (
    <>
      <TaskHeader
        title="새 공시"
        action={
          <button
            type="button"
            className="font-bold disabled:text-gray-300"
            disabled={!isDisclosureFilled(title, content) || isPending}
            aria-busy={isPending || undefined}
            onClick={() => mutate()}
          >
            게시
          </button>
        }
      />
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-9 py-2">
        <div className="flex items-center gap-2">
          <StockAvatar name={myStock?.name ?? ' '} className="size-7 text-xs" />
          <span className="text-sm font-bold">{myStock?.name}</span>
        </div>
        <div className="flex flex-col gap-1">
          <input
            aria-label="제목"
            placeholder="제목을 입력해 주세요."
            maxLength={DISCLOSURE_TITLE_MAX_LENGTH}
            value={title}
            className="text-lg font-bold outline-none"
            onChange={(event) => setTitle(event.target.value)}
          />
          <CharCounter
            length={title.length}
            max={DISCLOSURE_TITLE_MAX_LENGTH}
            showFrom={DISCLOSURE_TITLE_COUNTER_FROM}
            className="text-[10px]"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <textarea
            aria-label="내용"
            placeholder={
              '친구들과 공유할 소식을 작성해 주세요.\n작성한 소식을 바탕으로 내 종목의 AI 공시브리핑이 발행돼요.'
            }
            maxLength={DISCLOSURE_CONTENT_MAX_LENGTH}
            value={content}
            className="min-h-40 flex-1 resize-none text-sm outline-none"
            onChange={(event) => setContent(event.target.value)}
          />
          <CharCounter
            length={content.length}
            max={DISCLOSURE_CONTENT_MAX_LENGTH}
            showFrom={DISCLOSURE_CONTENT_COUNTER_FROM}
            className="text-[10px]"
          />
        </div>
        <ImageAttachments
          images={images}
          onRemove={(index) => setImages((prev) => prev.filter((_, i) => i !== index))}
        />
      </main>
      <footer className="flex shrink-0 items-center gap-4 border-t px-9 pt-3 pb-5 text-gray-500">
        <button
          type="button"
          aria-label="사진 찍기"
          onClick={() => cameraInputRef.current?.click()}
        >
          <CameraIcon className="size-5" />
        </button>
        <button
          type="button"
          aria-label="사진 고르기"
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImageIcon className="size-5" />
        </button>
        <span className="ml-auto text-xs">
          {images.length}/{DISCLOSURE_MAX_IMAGES}
        </span>
        <input
          ref={cameraInputRef}
          type="file"
          accept={DISCLOSURE_IMAGE_TYPES.join(',')}
          capture="environment"
          hidden
          onChange={handleFilesSelected}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept={DISCLOSURE_IMAGE_TYPES.join(',')}
          multiple
          hidden
          onChange={handleFilesSelected}
        />
      </footer>

      {blocker.state === 'blocked' && (
        <ConfirmModal
          title="공시 작성을 그만둘까요?"
          description="작성하신 내용은 저장되지 않아요."
          cancelLabel="계속 작성하기"
          confirmLabel="그만두기"
          onConfirm={() => blocker.proceed()}
          onCancel={() => blocker.reset()}
        />
      )}
    </>
  );
}

export default DisclosureCreateOverlay;
