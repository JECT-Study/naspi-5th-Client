import { Link } from 'react-router';
import type { CommentPreview, FeedItem } from '@/apis/domains/feed/feed.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { formatRelativeTime } from '@/utils/date';
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

const SENTIMENT_LABEL = { BULLISH: '호재', BEARISH: '악재' } as const;

function FirstComment({ comment }: { comment: CommentPreview }) {
  return (
    <div className="flex gap-2 pl-12">
      <ReplyIcon className="size-4 text-gray-400" />
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

// 피드의 공시·뉴스 카드 + 가장 먼저 달린 댓글 1건 (화면설계서 피드 1, 2)
// 카드를 누르면 상세로 가고, 공시의 호재/악재는 카드에서 바로 누른다 (링크 밖에 둔다)
function FeedCard({ roomId, item, to, variant }: FeedCardProps) {
  return (
    <article data-variant={variant} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <StockAvatar name={item.stockName} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link to={to} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold">{item.stockName}</span>
              <span className="text-gray-500">&gt; {item.type === 'NEWS' ? '뉴스' : '공시'}</span>
              {item.type === 'NEWS' && item.isAiBriefing && (
                <span className="rounded bg-gray-100 px-1">AI 공시브리핑</span>
              )}
              <span className="ml-auto shrink-0 text-gray-400">
                {formatRelativeTime(new Date(item.createdAt))}
              </span>
              {item.type === 'NEWS' && (
                <span className="shrink-0 rounded border px-1">
                  {SENTIMENT_LABEL[item.sentiment]}
                </span>
              )}
            </div>
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
              <DisclosureReactions
                roomId={roomId}
                disclosureId={item.disclosureId}
                myReaction={item.myReaction}
                bullishCount={item.bullishCount}
                bearishCount={item.bearishCount}
              />
            )}
            <span className="flex items-center gap-1">
              <ChatIcon className="size-3.5" />
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
