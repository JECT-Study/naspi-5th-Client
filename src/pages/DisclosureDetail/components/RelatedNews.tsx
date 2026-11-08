import { Link } from 'react-router';
import type { DisclosureDetail } from '@/apis/domains/disclosure/disclosure.types';
import FieldMessage from '@/components/FieldMessage';
import { ChevronRightIcon, RetryIcon } from '@/components/icons';

interface RelatedNewsProps {
  disclosure: DisclosureDetail;
  /** 뉴스 상세 경로 */
  newsPath: (newsId: number) => string;
  onRetry: () => void;
  isRetrying: boolean;
}

const SENTIMENT_LABEL = { BULLISH: '호재', BEARISH: '악재' } as const;

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
          <span className="shrink-0 rounded border px-1 text-[10px]">
            {SENTIMENT_LABEL[relatedNews.sentiment]}
          </span>
          <ChevronRightIcon className="size-4" />
        </Link>
      )}
      {newsStatus === 'FAILED' && (
        <div className="mt-1 flex items-center justify-between gap-2">
          <FieldMessage>뉴스 생성 중 오류가 발생했어요.</FieldMessage>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 text-xs underline disabled:opacity-40"
            disabled={isRetrying}
            onClick={onRetry}
          >
            <RetryIcon className="size-3.5" />
            다시 시도
          </button>
        </div>
      )}
    </section>
  );
}

export default RelatedNews;
