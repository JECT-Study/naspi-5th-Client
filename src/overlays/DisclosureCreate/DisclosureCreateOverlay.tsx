import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker, useNavigate } from 'react-router';
import { createDisclosure } from '@/apis/domains/disclosure/disclosure.service';
import {
  DISCLOSURE_CONTENT_MAX_LENGTH,
  DISCLOSURE_IMAGE_MAX_MB,
  DISCLOSURE_IMAGE_TYPES,
  DISCLOSURE_MAX_IMAGES,
  DISCLOSURE_TITLE_MAX_LENGTH,
  isDisclosureFilled,
  isDisclosureImage,
  isDisclosureImageSizeAllowed,
} from '@/apis/domains/disclosure/disclosure.validation';
import { feedKeys } from '@/apis/domains/feed/feed.queries';
import type { RoomId } from '@/apis/domains/room/room.types';
import { stockQueries } from '@/apis/domains/stock/stock.queries';
import CharCounter from '@/components/ui/CharCounter';
import ConfirmModal from '@/components/overlay/ConfirmModal';
import { CameraIcon, ImageIcon } from '@/components/ui/icons';
import TaskHeader from '@/components/header/TaskHeader';
import { useAutoHeight } from '@/hooks/useAutoHeight';
import { isForcedNavigation } from '@/hooks/useOverlay';
import { notify } from '@/libs/notify';
import { maxLengthHandlers } from '@/utils/maxLength';
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
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  useAutoHeight(titleRef, title);
  useAutoHeight(contentRef, content);
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
      {/* 시안 '공시 작성 콘텐츠': 위아래 8, 안쪽 폼은 위 20·좌우 24·아래 16, 칸 사이 24
          폼 아래 빈 곳을 눌러도 내용 칸에 입력되게 한다 */}
      <main
        className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2"
        onClick={(event) => {
          if (event.target === event.currentTarget) contentRef.current?.focus();
        }}
      >
        <div className="flex flex-col gap-6 px-6 pt-5 pb-4">
          {/* 시안 Post Header: 종목 이름 Body1.5 Grey/7 → 4 → 제목 */}
          <div className="flex flex-col gap-1">
            <span className="text-body1-5 text-grey-7">{myStock?.name}</span>
            {/* 시안 TitleInput: Heading3 Grey/8 (안내 문구도 Grey/8). 길면 줄바꿈된다
                글자 수는 처음부터 제목 오른쪽 끝(마지막 줄 높이)에 둔다. 제목은 글자 수 앞에서 줄바꿈 (테두리 없는 칸이라 자리는 정함) */}
            <div className="flex items-end gap-2">
              <textarea
                ref={titleRef}
                aria-label="제목"
                placeholder="제목을 입력해 주세요."
                rows={1}
                maxLength={DISCLOSURE_TITLE_MAX_LENGTH}
                value={title}
                className="block min-w-0 flex-1 resize-none text-heading3 text-grey-8 outline-none placeholder:text-grey-8"
                // 제목은 한 줄 글이라 Enter로 줄을 바꾸지 않는다 (화면에서만 길면 줄바꿈)
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.preventDefault();
                }}
                {...maxLengthHandlers<HTMLTextAreaElement>((event) =>
                  // 붙여넣은 줄바꿈도 빼서 제목을 한 줄 글로 둔다
                  setTitle(event.target.value.replace(/\n/g, ' ')),
                )}
              />
              <CharCounter length={title.length} max={DISCLOSURE_TITLE_MAX_LENGTH} />
            </div>
          </div>
          {/* 시안 BodyInput: Body1.5 (안내 문구 Grey/6, 입력값 Grey/8). 처음엔 안내 두 줄 높이, 쓰는 만큼 늘어난다
              글자 수는 처음부터 본문 바로 아래 오른쪽 (사이 4) */}
          <div className="flex flex-col items-end gap-1">
            <textarea
              ref={contentRef}
              aria-label="내용"
              placeholder={
                '오늘 있었던 일을 친구들과 공유해 주세요.\n작성한 소식을 바탕으로 AI 공시브리핑이 발행돼요.'
              }
              rows={2}
              maxLength={DISCLOSURE_CONTENT_MAX_LENGTH}
              value={content}
              className="block w-full resize-none text-body1-5 text-grey-8 outline-none placeholder:text-grey-6"
              {...maxLengthHandlers<HTMLTextAreaElement>((event) => setContent(event.target.value))}
            />
            <CharCounter length={content.length} max={DISCLOSURE_CONTENT_MAX_LENGTH} />
          </div>
          <ImageAttachments
            images={images}
            onRemove={(index) => setImages((prev) => prev.filter((_, i) => i !== index))}
          />
        </div>
      </main>
      {/* 시안 '이미지업로드': 왼쪽 16에 카메라·갤러리 24 (사이 6), 화면 아래에서 19 위 */}
      <footer className="flex shrink-0 items-center gap-1.5 px-4 pt-2 pb-4.75">
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
