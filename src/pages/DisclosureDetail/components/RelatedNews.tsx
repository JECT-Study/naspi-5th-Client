import type { DisclosureDetail } from '@/apis/domains/disclosure/disclosure.types';
import { RelatedLinkCard, RelatedNoticeCard } from '@/components/feed/RelatedCard';
import Chip from '@/components/ui/Chip';
import FieldMessage from '@/components/ui/FieldMessage';
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

  if (newsStatus === 'PUBLISHED' && relatedNews) {
    return (
      <RelatedLinkCard
        label="관련 뉴스"
        to={newsPath(relatedNews.newsId)}
        title={relatedNews.title}
        chip={<Chip kind={relatedNews.sentiment} />}
      />
    );
  }
  if (newsStatus === 'FAILED' && isMine) {
    return (
      <RelatedNoticeCard
        label="관련 뉴스"
        message={<FieldMessage>뉴스 생성 중 오류가 발생했어요.</FieldMessage>}
        action={<RetryButton className="shrink-0" disabled={isRetrying} onClick={onRetry} />}
      />
    );
  }
  return null;
}

export default RelatedNews;
