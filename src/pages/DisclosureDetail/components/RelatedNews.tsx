import { Link } from 'react-router';
import type { DisclosureDetail } from '@/apis/domains/disclosure/disclosure.types';
import Chip from '@/components/Chip';
import FieldMessage from '@/components/FieldMessage';
import { ChevronRightIcon } from '@/components/icons';
import RetryButton from '@/components/RetryButton';

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

  return (
    <section className="rounded-lg bg-gray-50 px-4 py-3">
      <p className="text-[10px] text-gray-500">관련 뉴스</p>
      {newsStatus === 'PUBLISHED' && relatedNews && (
        <Link to={newsPath(relatedNews.newsId)} className="mt-1 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{relatedNews.title}</span>
          <Chip kind={relatedNews.sentiment} />
          <ChevronRightIcon className="text-grey-6" />
        </Link>
      )}
      {newsStatus === 'FAILED' && (
        <div className="mt-1 flex items-center justify-between gap-2">
          <FieldMessage>뉴스 생성 중 오류가 발생했어요.</FieldMessage>
          <RetryButton className="shrink-0" disabled={isRetrying} onClick={onRetry} />
        </div>
      )}
    </section>
  );
}

export default RelatedNews;
