import { Link } from 'react-router';
import type { CommentPreview, FeedItem } from '@/apis/domains/feed/feed.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/date';
import Chip from '@/components/ui/Chip';
import DisclosureReactions from './DisclosureReactions';
import { ChatIcon, ReplyIcon } from '@/components/ui/icons';
import StockAvatar from '@/components/stock/StockAvatar';

/**
 * 카드가 놓이는 화면
 * - feed: 리그 피드. 맨 위에 '공시'·'뉴스' 라벨, 종목 프로필·종목명 → 종목 차트
 * - stock: 종목 정보. 공시/뉴스 필터로 이미 나뉘어 있어 라벨 없음 (시안 종목정보/공시·뉴스), 종목 링크 없음(이미 그 종목)
 */
export type FeedCardVariant = 'feed' | 'stock';

interface FeedCardProps {
  roomId: RoomId;
  item: FeedItem;
  /** 공시·뉴스 상세 경로 */
  to: string;
  variant: FeedCardVariant;
}

// 시안 Comment Preview: 카드 바로 아래(사이 0) 흰 줄, 여백 12·15, 화살표와 내용 사이 10
// - 화살표: CommentArrow 18 Grey/4, 위 18·아래 10 여백 안 (본문 줄 옆에 오도록)
// - 내용: 이름 | 시간 (Body3 Grey/6, 사이 4, 가운데 세로선 10) → 4 → 본문 Body1 Grey/8
function FirstComment({ comment }: { comment: CommentPreview }) {
  return (
    <div className="flex items-center gap-2.5 px-3.75 py-3">
      <div className="flex shrink-0 pt-4.5 pb-2.5">
        <ReplyIcon className="text-grey-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1 text-body3 text-grey-6">
          <span className="truncate">{comment.authorName}</span>
          <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-grey-6" />
          <span className="shrink-0">{formatRelativeTime(new Date(comment.createdAt))}</span>
        </div>
        <p className="line-clamp-2 text-body1 text-grey-8">{comment.content}</p>
      </div>
    </div>
  );
}

// 카드 위로 올려 상세 링크보다 먼저 눌리게 하는 요소 (종목 링크, 호재/악재 버튼, 넘기는 이미지 줄)
const ABOVE_CARD_LINK = 'relative z-10';

const IMAGE_CLASS = 'h-50 rounded-md bg-grey-1 object-cover';

// 공시 첨부 이미지 (설계서 v.1.8: 순서대로 모두 표시, 시안 이미지=1·2·3-4)
// - 1장: 폭 전체 × 200 / 2장: 반씩 나란히(사이 8) × 200 / 3~4장: 150×200 고정, 사이 8, 가로로 넘김
// 3~4장은 넘기려면 줄이 카드 링크 위에 있어야 해서, 이미지마다 상세 링크를 따로 건다 (눌러도 상세로)
// 넘기는 줄은 카드 좌우 여백(12)까지 넓혀 화면 끝까지 넘어가게 한다. 넘기는 동작은 프로토타입 때 다듬는다
function AttachedImages({ imageUrls, to }: { imageUrls: string[]; to: string }) {
  if (imageUrls.length <= 2) {
    return (
      <div className="flex gap-2">
        {imageUrls.map((url) => (
          <img key={url} src={url} alt="" className={cn(IMAGE_CLASS, 'min-w-0 flex-1')} />
        ))}
      </div>
    );
  }
  return (
    <div
      className={cn(
        ABOVE_CARD_LINK,
        '-mx-3 flex snap-x scroll-px-3 [scrollbar-width:none] gap-2 overflow-x-auto px-3',
      )}
    >
      {imageUrls.map((url) => (
        <Link key={url} to={to} tabIndex={-1} aria-hidden="true" className="shrink-0 snap-start">
          <img src={url} alt="" className={cn(IMAGE_CLASS, 'w-37.5')} />
        </Link>
      ))}
    </div>
  );
}

// 피드의 공시·뉴스 카드 + 가장 먼저 달린 댓글 1건 (화면설계서 피드 1, 2)
// 누르는 곳에 따라 (기획 공유: 프로필 클릭 → 종목 차트)
// - 카드 어디든 → 공시·뉴스 상세
// - 피드의 종목 프로필(원)·종목명 → 그 종목 차트 (종목 정보 화면의 카드는 이미 그 종목이라 상세로)
// - 호재/악재 → 반응만 바뀌고 이동하지 않는다
// 상세 링크의 ::after를 카드 전체로 늘리고(stretched link), 종목 링크와 반응 버튼은 그 위에 올린다
// 링크 안에 링크·버튼을 넣지 않고 서로 형제로 두므로, 누른 요소만 동작하고 클릭이 상세 링크로 번지지 않는다
// 시안 SmallBoard 공시·뉴스 카드: 여백 12, 줄 사이 8
// - 공시: "공시" 라벨 → 프로필 줄(종목 프로필 32 + 10 + [종목명·시간 / 제목]) → 본문 → (이미지) → 댓글 수·호재/악재
// - 뉴스: "뉴스" 라벨 + AI 칩 · 오른쪽 호재/악재 칩 → 제목·시간 → 본문 → 댓글 수 (프로필 없음)
function FeedCard({ roomId, item, to, variant }: FeedCardProps) {
  const stockPath = variant === 'feed' ? `/leagues/${roomId}/stocks/${item.stockId}` : undefined;
  const showTypeLabel = variant === 'feed';
  const time = formatRelativeTime(new Date(item.createdAt));
  // 제목 링크의 ::after를 카드(article) 전체로 늘려, 카드 어디를 눌러도 상세로 간다
  const titleLink = (
    <Link to={to} className="truncate text-title4 text-grey-8 after:absolute after:inset-0">
      {item.title}
    </Link>
  );

  return (
    <article data-variant={variant} className="relative flex flex-col">
      <div className="flex flex-col gap-2 p-3">
        {item.type === 'NEWS' ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {showTypeLabel && <span className="text-button3-5 text-grey-6">뉴스</span>}
                {item.isAiBriefing && <Chip kind="AI" />}
              </div>
              <Chip kind={item.sentiment} />
            </div>
            {/* 제목 Title4 Grey/8 + 오른쪽 시간 Body3 Grey/6 */}
            <div className="flex items-center justify-between gap-0.5">
              {titleLink}
              <span className="shrink-0 text-body3 text-grey-6">{time}</span>
            </div>
          </>
        ) : (
          <>
            {showTypeLabel && <span className="text-button3-5 text-grey-6">공시</span>}
            {/* 프로필 줄 (높이 38): 종목명·시간 Body3 Grey/6 (양 끝), 2 띄우고 제목 Title4 Grey/8 */}
            <div className="flex items-center gap-2.5">
              {stockPath ? (
                <Link
                  to={stockPath}
                  aria-label={`${item.stockName} 차트 보기`}
                  className={ABOVE_CARD_LINK}
                >
                  <StockAvatar name={item.stockName} className="size-8 text-title4" />
                </Link>
              ) : (
                <StockAvatar name={item.stockName} className="size-8 text-title4" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-start justify-between gap-0.5 text-body3 text-grey-6">
                  {stockPath ? (
                    <Link to={stockPath} className={cn(ABOVE_CARD_LINK, 'truncate')}>
                      {item.stockName}
                    </Link>
                  ) : (
                    <span className="truncate">{item.stockName}</span>
                  )}
                  <span className="shrink-0">{time}</span>
                </div>
                {titleLink}
              </div>
            </div>
          </>
        )}

        <p className="line-clamp-2 text-body1 text-grey-8">{item.content}</p>

        {item.type === 'DISCLOSURE' && item.imageUrls.length > 0 && (
          <AttachedImages imageUrls={item.imageUrls} to={to} />
        )}

        {/* 아래 줄: 왼쪽 댓글 수(Comment 24 Grey/4 + Body2 Grey/4), 오른쪽 호재/악재(공시만) */}
        <div className="flex items-center justify-between gap-3">
          {/* 댓글 수는 카드 전체 링크로 상세(댓글이 있는 화면)로 간다 */}
          <span className="flex items-center gap-1 py-0.5 pr-1 text-body2 text-grey-4">
            <ChatIcon />
            {item.commentCount}
          </span>
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
        </div>
      </div>
      {item.firstComment && <FirstComment comment={item.firstComment} />}
    </article>
  );
}

export default FeedCard;
