import { Link } from 'react-router';
import type { CommentPreview, FeedItem } from '@/apis/domains/feed/feed.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/date';
import Chip from './Chip';
import DisclosureReactions from './DisclosureReactions';
import { ChatIcon, ReplyIcon } from './icons';
import StockAvatar from './StockAvatar';

/**
 * 카드가 놓이는 화면. 피드와 종목 정보는 디자인이 조금 다를 예정이라 이 값으로 분기한다
 * TODO(디자인): 아직은 두 화면이 같다. 디자인이 나오면 variant에 따라 클래스·표시 요소를 나눈다
 */
export type FeedCardVariant = 'feed' | 'stock';

interface FeedCardProps {
  roomId: RoomId;
  item: FeedItem;
  /** 공시·뉴스 상세 경로 */
  to: string;
  variant: FeedCardVariant;
}

function FirstComment({ comment }: { comment: CommentPreview }) {
  return (
    <div className="flex gap-2 pl-12">
      <ReplyIcon className="text-grey-4" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold">{comment.authorName}</span>
          <span className="text-gray-400">{formatRelativeTime(new Date(comment.createdAt))}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{comment.content}</p>
      </div>
    </div>
  );
}

// 카드 위로 올려 상세 링크보다 먼저 눌리게 하는 요소 (종목 링크, 호재/악재 버튼)
const ABOVE_CARD_LINK = 'relative z-10';

// 피드의 공시·뉴스 카드 + 가장 먼저 달린 댓글 1건 (화면설계서 피드 1, 2)
// 누르는 곳에 따라 (기획 공유: 프로필 클릭 → 종목 차트)
// - 카드 어디든 → 공시·뉴스 상세
// - 피드의 종목 프로필(원)·종목명 → 그 종목 차트 (종목 정보 화면의 카드는 이미 그 종목이라 상세로)
// - 호재/악재 → 반응만 바뀌고 이동하지 않는다
// 상세 링크의 ::after를 카드 전체로 늘리고(stretched link), 종목 링크와 반응 버튼은 그 위에 올린다
// 링크 안에 링크·버튼을 넣지 않고 서로 형제로 두므로, 누른 요소만 동작하고 클릭이 상세 링크로 번지지 않는다
function FeedCard({ roomId, item, to, variant }: FeedCardProps) {
  const stockPath = variant === 'feed' ? `/leagues/${roomId}/stocks/${item.stockId}` : undefined;

  return (
    <article data-variant={variant} className="relative flex flex-col gap-3">
      <div className="flex gap-3">
        {stockPath ? (
          <Link
            to={stockPath}
            aria-label={`${item.stockName} 차트 보기`}
            className={cn(ABOVE_CARD_LINK, 'self-start')}
          >
            <StockAvatar name={item.stockName} />
          </Link>
        ) : (
          <StockAvatar name={item.stockName} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs">
            {stockPath ? (
              <Link to={stockPath} className={cn(ABOVE_CARD_LINK, 'font-bold')}>
                {item.stockName}
              </Link>
            ) : (
              <span className="font-bold">{item.stockName}</span>
            )}
            <span className="text-gray-500">&gt; {item.type === 'NEWS' ? '뉴스' : '공시'}</span>
            {item.type === 'NEWS' && item.isAiBriefing && <Chip kind="AI" />}
            <span className="ml-auto shrink-0 text-gray-400">
              {formatRelativeTime(new Date(item.createdAt))}
            </span>
            {item.type === 'NEWS' && <Chip kind={item.sentiment} />}
          </div>
          {/* after:inset-0: 이 링크의 누르는 영역을 카드(article) 전체로 늘린다 */}
          <Link to={to} className="flex flex-col gap-1 after:absolute after:inset-0">
            <p className="font-bold">{item.title}</p>
            <p className="line-clamp-2 text-sm text-gray-600">{item.content}</p>
            {item.type === 'DISCLOSURE' && item.thumbnailUrl && (
              <img
                src={item.thumbnailUrl}
                alt=""
                className="mt-1 size-28 rounded-lg bg-gray-100 object-cover"
              />
            )}
          </Link>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            {item.type === 'DISCLOSURE' && (
              // 버튼 사이 빈틈을 누르면 상세로 가지 않도록 버튼 묶음 전체를 올린다
              <div className={cn(ABOVE_CARD_LINK, 'flex gap-2')}>
                <DisclosureReactions
                  roomId={roomId}
                  disclosureId={item.disclosureId}
                  myReaction={item.myReaction}
                  bullishCount={item.bullishCount}
                  bearishCount={item.bearishCount}
                />
              </div>
            )}
            {/* 댓글 수는 카드 전체 링크로 상세(댓글이 있는 화면)로 간다 */}
            <span className="flex items-center gap-1">
              <ChatIcon className="text-grey-4" />
              {item.commentCount}
            </span>
          </div>
        </div>
      </div>
      {item.firstComment && <FirstComment comment={item.firstComment} />}
    </article>
  );
}

export default FeedCard;
