import { useEffect, useMemo } from 'react';
import { TrashIcon } from '@/components/icons';

interface ImageAttachmentsProps {
  images: File[];
  onRemove: (index: number) => void;
}

// 첨부한 이미지 미리보기 + 삭제
function ImageAttachments({ images, onRemove }: ImageAttachmentsProps) {
  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);

  // 미리보기 주소는 쓰지 않게 되면 풀어 준다
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  if (images.length === 0) return null;

  return (
    <ul className="flex gap-2 overflow-x-auto">
      {previews.map((url, index) => (
        <li key={url} className="relative shrink-0">
          <img src={url} alt="" className="size-28 rounded-lg bg-gray-100 object-cover" />
          <button
            type="button"
            aria-label={`이미지 ${index + 1} 삭제`}
            className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1"
            onClick={() => onRemove(index)}
          >
            <TrashIcon className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ImageAttachments;
