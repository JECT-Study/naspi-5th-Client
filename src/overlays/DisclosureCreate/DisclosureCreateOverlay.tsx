import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker, useNavigate } from 'react-router';
import { createDisclosure } from '@/apis/domains/disclosure/disclosure.service';
import {
  DISCLOSURE_CONTENT_COUNTER_FROM,
  DISCLOSURE_CONTENT_MAX_LENGTH,
  DISCLOSURE_IMAGE_MAX_MB,
  DISCLOSURE_IMAGE_TYPES,
  DISCLOSURE_MAX_IMAGES,
  DISCLOSURE_TITLE_COUNTER_FROM,
  DISCLOSURE_TITLE_MAX_LENGTH,
  isDisclosureFilled,
  isDisclosureImage,
  isDisclosureImageSizeAllowed,
} from '@/apis/domains/disclosure/disclosure.validation';
import { feedKeys } from '@/apis/domains/feed/feed.queries';
import type { RoomId } from '@/apis/domains/room/room.types';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import CharCounter from '@/components/CharCounter';
import ConfirmModal from '@/components/ConfirmModal';
import { CameraIcon, ImageIcon } from '@/components/icons';
import StockAvatar from '@/components/StockAvatar';
import TaskHeader from '@/components/TaskHeader';
import { useAutoHeight } from '@/hooks/useAutoHeight';
import { useMaxLengthInput } from '@/hooks/useMaxLengthInput';
import { isForcedNavigation } from '@/hooks/useOverlay';
import { notify } from '@/libs/notify';
import { cn } from '@/utils/cn';
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
  const {
    ref: titleRef,
    isOverLimit: isTitleOverLimit,
    handlers: titleHandlers,
  } = useMaxLengthInput<HTMLTextAreaElement>({
    maxLength: DISCLOSURE_TITLE_MAX_LENGTH,
    // 붙여넣은 줄바꿈도 빼서 제목을 한 줄 글로 둔다
    onChange: (event) => setTitle(event.target.value.replace(/\n/g, ' ')),
  });
  const {
    ref: contentRef,
    isOverLimit: isContentOverLimit,
    handlers: contentHandlers,
  } = useMaxLengthInput<HTMLTextAreaElement>({
    maxLength: DISCLOSURE_CONTENT_MAX_LENGTH,
    onChange: (event) => setContent(event.target.value),
  });
  useAutoHeight(titleRef, title);
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

  // 사진 선택 (공시 쓰기 4, v.1.7)
  // - 개수 초과(4-2)·형식 오류(4-4): 고른 사진을 하나도 올리지 않고 토스트
  // - 용량 초과(4-3): 50MB를 넘는 사진만 빼고 나머지는 올린다
  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // 같은 파일을 다시 고를 수 있게 비운다
    event.target.value = '';
    if (files.length === 0) return;

    if (images.length + files.length > DISCLOSURE_MAX_IMAGES) {
      notify.error(`최대 ${DISCLOSURE_MAX_IMAGES}장의 사진까지 업로드할 수 있어요.`);
      return;
    }
    if (!files.every(isDisclosureImage)) {
      notify.error('이미지를 업로드하지 못했어요.');
      return;
    }
    const allowedFiles = files.filter(isDisclosureImageSizeAllowed);
    if (allowedFiles.length < files.length) {
      notify.error(`${DISCLOSURE_IMAGE_MAX_MB}MB 이하의 사진만 업로드할 수 있어요.`);
    }
    if (allowedFiles.length > 0) setImages((prev) => [...prev, ...allowedFiles]);
  };

  return (
    <>
      <TaskHeader
        title="새 공시"
        action={{
          label: '게시',
          disabled: !isDisclosureFilled(title, content),
          isPending,
          onClick: () => mutate(),
        }}
      />
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-9 py-2">
        <div className="flex items-center gap-2">
          <StockAvatar name={myStock?.name ?? ' '} className="size-7 text-xs" />
          <span className="text-sm font-bold">{myStock?.name}</span>
        </div>
        {/* 시안 TitleInput: Heading3 Grey/8 (안내 문구도 Grey/8). 길면 줄바꿈되고, 글자 수가 보이면 아래 32를 비운다 */}
        <div className="relative">
          <textarea
            ref={titleRef}
            aria-label="제목"
            placeholder="제목을 입력해 주세요."
            rows={1}
            maxLength={DISCLOSURE_TITLE_MAX_LENGTH}
            value={title}
            className={cn(
              'block w-full resize-none text-heading3 text-grey-8 outline-none placeholder:text-grey-8',
              title.length >= DISCLOSURE_TITLE_COUNTER_FROM && 'pb-8',
            )}
            // 제목은 한 줄 글이라 Enter로 줄을 바꾸지 않는다 (화면에서만 길면 줄바꿈)
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
            {...titleHandlers}
          />
          <CharCounter
            length={title.length}
            max={DISCLOSURE_TITLE_MAX_LENGTH}
            showFrom={DISCLOSURE_TITLE_COUNTER_FROM}
            isOverLimit={isTitleOverLimit}
          />
        </div>
        {/* 시안 BodyInput: Body1.5 (안내 문구 Grey/6, 입력값 Grey/8). 남은 높이를 채워 어디를 눌러도 입력된다 */}
        <div className="relative flex flex-1 flex-col">
          <textarea
            ref={contentRef}
            aria-label="내용"
            placeholder={
              '오늘 있었던 일을 친구들과 공유해 주세요.\n작성한 소식을 바탕으로 AI 공시브리핑이 발행돼요.'
            }
            maxLength={DISCLOSURE_CONTENT_MAX_LENGTH}
            value={content}
            className={cn(
              'min-h-40 flex-1 resize-none text-body1-5 text-grey-8 outline-none placeholder:text-grey-6',
              content.length >= DISCLOSURE_CONTENT_COUNTER_FROM && 'pb-8',
            )}
            {...contentHandlers}
          />
          <CharCounter
            length={content.length}
            max={DISCLOSURE_CONTENT_MAX_LENGTH}
            showFrom={DISCLOSURE_CONTENT_COUNTER_FROM}
            isOverLimit={isContentOverLimit}
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
          <CameraIcon className="text-grey-8" />
        </button>
        <button
          type="button"
          aria-label="사진 고르기"
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImageIcon className="text-grey-8" />
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
