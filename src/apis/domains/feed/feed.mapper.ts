import type { CommentResponse } from '@/apis/domains/comment/comment.types';
import type { Reaction, ReactionType } from '@/apis/domains/disclosure/disclosure.types';
import type { NewsSentiment, Sentiment } from '@/apis/domains/news/news.types';
import { withKstOffset } from '@/utils/date';
import type {
  CommentPreview,
  FeedItem,
  FeedItemResponse,
  FeedPageResponse,
  FeedResponse,
} from './feed.types';

// 서버(피드) → 화면 모양 바꾸기. 일시는 KST에 시간대를 붙여 둔다 (utils/date withKstOffset)
// 다른 도메인 함수는 가져오지 않는 규칙(docs/ARCHITECTURE)이라 호재/악재·댓글 바꾸기는
// disclosure·news·comment 매퍼와 같은 내용을 둔다

const WITHDRAWN_NAME = '탈퇴한 사용자';

const toReaction = (type: ReactionType | null): Reaction | null =>
  type === 'LIKE' ? 'BULLISH' : type === 'DISLIKE' ? 'BEARISH' : null;

const toSentiment = (sentiment: NewsSentiment): Sentiment =>
  sentiment === 'POSITIVE' ? 'BULLISH' : 'BEARISH';

const toCommentPreview = (comment: CommentResponse | null): CommentPreview | null =>
  comment && {
    commentId: comment.commentId,
    authorName: comment.authorName ?? WITHDRAWN_NAME,
    content: comment.content,
    createdAt: withKstOffset(comment.createdAt),
  };

const toFeedItem = (item: FeedItemResponse): FeedItem => {
  const base = {
    stockId: item.stockId,
    stockName: item.stockName,
    title: item.title,
    content: item.body,
    commentCount: item.commentCount,
    firstComment: toCommentPreview(item.previewComment),
  };
  if (item.type === 'NEWS') {
    return {
      ...base,
      type: 'NEWS',
      newsId: item.newsId,
      // 서버 뉴스는 모두 공시를 바탕으로 AI가 쓴 뉴스다
      isAiBriefing: true,
      sentiment: toSentiment(item.sentiment),
      // 뉴스 카드 시간은 발행 일시 (피드도 발행 일시 순서)
      createdAt: withKstOffset(item.publishedAt),
    };
  }
  return {
    ...base,
    type: 'DISCLOSURE',
    disclosureId: item.disclosureId,
    imageUrls: item.images.map((image) => image.signedUrl),
    bullishCount: item.likeCount,
    bearishCount: item.dislikeCount,
    myReaction: toReaction(item.myReaction),
    createdAt: withKstOffset(item.createdAt),
  };
};

export const toFeedResponse = (page: FeedPageResponse): FeedResponse => ({
  items: page.items.map(toFeedItem),
  nextCursor: page.nextCursor,
});
