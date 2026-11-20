import { Link } from 'react-router';
import type { DisclosureDetail } from '@/apis/domains/disclosure/disclosure.types';
import Chip from '@/components/ui/Chip';
import FieldMessage from '@/components/ui/FieldMessage';
import { ChevronRightIcon } from '@/components/ui/icons';
import RetryButton from '@/components/ui/RetryButton';

interface RelatedNewsProps {
  disclosure: DisclosureDetail;
  /** 뉴스 상세 경로 */
  newsPath: (newsId: number) => string;
  onRetry: () => void;
  isRetrying: boolean;
}

// 관련 뉴스 (화면설계서 공시 상세 5)
// 발행됨 → 모두에게 표시, 누르면 뉴스로 이동 / 생성 중 → 모두에게 영역 전체 숨김
// 생성 실패 → 작성자에게만 오류 안내 + 다시 시도, 다른 사람에게는 영역 전체 숨김
function RelatedNews({ disclosure, newsPath, onRetry, isRetrying }: RelatedNewsProps) {
  const { newsStatus, relatedNews, isMine } = disclosure;
  const isVisible =
    (newsStatus === 'PUBLISHED' && relatedNews !== null) || (newsStatus === 'FAILED' && isMine);
  if (!isVisible) return null;

  // 시안 Card/관련뉴스·뉴스오류: 흰색, 여백 12·16, 줄 사이 8, 라벨 "관련 뉴스" Button3.5 Grey/6
  // - 발행됨: [라벨 / 호재·악재 칩] → [제목 Title4 Grey/8 / Right 18], 카드 전체가 뉴스로 가는 링크
  // - 생성 실패: [라벨 → 오류 문구] 오른쪽에 다시 시도, 위아래 Grey/2 선 (시안 뉴스오류만 선이 있음)
  // 문구는 설계서 "관련 뉴스" (시안 "관련뉴스"). 시안 배경 이미지(40%)는 임시로 보여 넣지 않음 (결정 문서)
  const label = <span className="text-button3-5 text-grey-6">관련 뉴스</span>;

  if (newsStatus === 'PUBLISHED' && relatedNews) {
    return (
      <Link to={newsPath(relatedNews.newsId)} className="flex flex-col gap-2 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {label}
          <Chip kind={relatedNews.sentiment} />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="min-w-0 flex-1 truncate text-title4 text-grey-8">
            {relatedNews.title}
          </span>
          <ChevronRightIcon className="text-grey-6" />
        </div>
      </Link>
    );
  }

  return (
    // 시안 높이 72: 위아래 선(1)이 여백 12 바깥에 더해진다
    <section className="flex items-center justify-between gap-2 bg-white px-4 py-3.25 shadow-[inset_0_1px_0_var(--color-grey-2),inset_0_-1px_0_var(--color-grey-2)]">
      <div className="flex min-w-0 flex-col gap-2">
        {label}
        <FieldMessage>뉴스 생성 중 오류가 발생했어요.</FieldMessage>
      </div>
      <RetryButton className="shrink-0" disabled={isRetrying} onClick={onRetry} />
    </section>
  );
}

export default RelatedNews;
