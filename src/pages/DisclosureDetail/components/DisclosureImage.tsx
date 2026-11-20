import { useState } from 'react';
import { ATTACHED_IMAGE_CLASS } from '@/components/feed/AttachedImages';
import RetryButton from '@/components/ui/RetryButton';
import { cn } from '@/utils/cn';

interface DisclosureImageProps {
  src: string;
  label: string;
  onOpen: () => void;
  /** 장수별 폭 (AttachedImages가 정한다) */
  className?: string;
}

// 공시 본문의 이미지 한 장: 누르면 크게 보기 (공시 상세 3), 못 불러오면 그 자리에서 다시 시도 (공시 상세 3-2)
// 크기·모양은 피드와 같은 첨부 이미지 (높이 200, 모서리 6)
function DisclosureImage({ src, label, onOpen, className }: DisclosureImageProps) {
  const [hasError, setHasError] = useState(false);
  // 다시 시도할 때 img를 새로 그려 다시 요청하게 한다
  const [attempt, setAttempt] = useState(0);

  if (hasError) {
    return (
      <div
        className={cn(
          'flex h-50 flex-col items-center justify-center gap-2 rounded-md bg-grey-1 px-2 text-center text-body3 text-grey-6',
          className,
        )}
      >
        <p>이미지를 불러오지 못했어요.</p>
        <RetryButton
          onClick={() => {
            setHasError(false);
            setAttempt((prev) => prev + 1);
          }}
        />
      </div>
    );
  }

  return (
    <button type="button" aria-label={label} className={className} onClick={onOpen}>
      <img
        key={attempt}
        src={src}
        alt=""
        className={ATTACHED_IMAGE_CLASS}
        onError={() => setHasError(true)}
      />
    </button>
  );
}

export default DisclosureImage;
