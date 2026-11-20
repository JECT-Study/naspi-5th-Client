import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** 첨부 이미지 한 장의 모양 (높이 200, 모서리 6, Grey/1 바탕). 폭은 장수별 배치 클래스가 정한다 */
export const ATTACHED_IMAGE_CLASS = 'h-50 w-full rounded-md bg-grey-1 object-cover';

interface AttachedImagesProps {
  imageUrls: string[];
  /**
   * 이미지 한 장을 그린다. layoutClass(장수별 폭)는 가장 바깥 요소에 붙인다
   * 피드: 1~2장은 img 그대로, 3~4장은 상세 링크로 감쌈 / 공시 상세: 크게 보기 버튼으로 감쌈
   */
  renderImage: (url: string, index: number, layoutClass: string) => ReactNode;
  /** 넘기는 줄(3~4장)을 카드 전체 링크 위로 올린다 (피드 카드: 넘기려면 줄이 링크 위에 있어야 함) */
  raised?: boolean;
  /** 넘기는 줄을 감싼 쪽 좌우 여백만큼 넓히는 클래스 (기본: 카드 여백 12, 공시 쓰기: 화면 여백 24) */
  bleedClass?: string;
}

// 공시 첨부 이미지 장수별 배치 (설계서 v.1.8: 순서대로 모두 표시, 시안 공시 이미지=1·2·3-4)
// - 1장: 폭 전체 / 2장: 반씩 나란히(사이 8) / 3~4장: 150 고정, 사이 8, 가로로 넘김
// 넘기는 줄은 감싼 쪽 좌우 여백까지 넓혀 화면 끝까지 넘어가게 하고, 넘기면 이미지 앞이 그 여백에 맞춰 멈춘다
function AttachedImages({
  imageUrls,
  renderImage,
  raised = false,
  bleedClass = '-mx-3 scroll-px-3 px-3',
}: AttachedImagesProps) {
  const isScroll = imageUrls.length > 2;
  return (
    <div
      className={cn(
        'flex gap-2',
        isScroll && cn('snap-x scrollbar-none overflow-x-auto', bleedClass),
        isScroll && raised && 'relative z-10',
      )}
    >
      {imageUrls.map((url, index) =>
        renderImage(url, index, isScroll ? 'w-37.5 shrink-0 snap-start' : 'min-w-0 flex-1'),
      )}
    </div>
  );
}

export default AttachedImages;
