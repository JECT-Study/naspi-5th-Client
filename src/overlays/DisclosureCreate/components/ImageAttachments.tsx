import { useEffect, useMemo } from 'react';
import AttachedImages, { ATTACHED_IMAGE_CLASS } from '@/components/feed/AttachedImages';
import { CloseIcon } from '@/components/ui/icons';
import { cn } from '@/utils/cn';

interface ImageAttachmentsProps {
  images: File[];
  onRemove: (index: number) => void;
}

// 첨부한 이미지 미리보기 + 빼기 (공시 쓰기 4-1)
// 시안 Attachment Images: 150×200 모서리 6, 사이 8, 화면 끝까지 가로로 넘김. 오른쪽 위(위 8·오른쪽 6)에 얇은 X 16 Grey/6
// 장수별 크기는 공시 상세와 같은 규칙 (시안은 3장 예시만 있음, 결정 문서)
function ImageAttachments({ images, onRemove }: ImageAttachmentsProps) {
  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);

  // 미리보기 주소는 쓰지 않게 되면 풀어 준다
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  if (images.length === 0) return null;

  return (
    <AttachedImages
      imageUrls={previews}
      bleedClass="-mx-6 scroll-px-6 px-6"
      renderImage={(url, index, layoutClass) => (
        <div key={url} className={cn('relative', layoutClass)}>
          <img src={url} alt="" className={ATTACHED_IMAGE_CLASS} />
          {/* 누르는 영역은 24로 넓히고, 아이콘 자리는 시안 위치 그대로 */}
          <button
            type="button"
            aria-label={`이미지 ${index + 1} 삭제`}
            className="absolute top-1 right-0.5 p-1"
            onClick={() => onRemove(index)}
          >
            <CloseIcon className="size-4 text-grey-6" />
          </button>
        </div>
      )}
    />
  );
}

export default ImageAttachments;
