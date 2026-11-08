import { useState } from 'react';
import { RetryIcon } from '@/components/icons';

interface DisclosureImageProps {
  src: string;
  label: string;
  onOpen: () => void;
}

// 공시 본문의 이미지 한 장: 누르면 크게 보기 (공시 상세 3), 못 불러오면 그 자리에서 다시 시도 (공시 상세 3-2)
function DisclosureImage({ src, label, onOpen }: DisclosureImageProps) {
  const [hasError, setHasError] = useState(false);
  // 다시 시도할 때 img를 새로 그려 다시 요청하게 한다
  const [attempt, setAttempt] = useState(0);

  if (hasError) {
    return (
      <div className="flex size-28 flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-[10px] text-gray-500">
        <p>이미지를 불러오지 못했어요.</p>
        <button
          type="button"
          className="flex items-center gap-0.5 underline"
          onClick={() => {
            setHasError(false);
            setAttempt((prev) => prev + 1);
          }}
        >
          <RetryIcon className="size-3" />
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={onOpen}>
      <img
        key={attempt}
        src={src}
        alt=""
        className="size-28 rounded-lg bg-gray-100 object-cover"
        onError={() => setHasError(true)}
      />
    </button>
  );
}

export default DisclosureImage;
