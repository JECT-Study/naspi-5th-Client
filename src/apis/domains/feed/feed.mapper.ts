import type { Reaction } from '@/apis/domains/disclosure/disclosure.types';
import type { Sentiment } from '@/apis/domains/news/news.types';
import { withKstOffset } from '@/utils/date';
import type {
  CommentPreview,
  CommentResponse,
  FeedItem,
  FeedItemResponse,
  FeedPageResponse,
  FeedResponse,
  NewsSentiment,
  ReactionType,
} from './feed.types';

// 서버(피드) → 화면 모양 바꾸기. 일시는 KST에 시간대를 붙여 둔다 (utils/date withKstOffset)

const WITHDRAWN_NAME = '탈퇴한 사용자';

const REACTION_FROM_SERVER: Record<ReactionType, Reaction> = {
  LIKE: 'BULLISH',
  DISLIKE: 'BEARISH',
};
const REACTION_TO_SERVER: Record<Reaction, ReactionType> = {
  BULLISH: 'LIKE',
  BEARISH: 'DISLIKE',
};
const SENTIMENT_FROM_SERVER: Record<NewsSentiment, Sentiment> = {
  POSITIVE: 'BULLISH',
  NEGATIVE: 'BEARISH',
};

export const toReaction = (type: ReactionType | null): Reaction | null =>
  type ? REACTION_FROM_SERVER[type] : null;

export const toReactionType = (reaction: Reaction): ReactionType => REACTION_TO_SERVER[reaction];

export const toSentiment = (sentiment: NewsSentiment): Sentiment =>
  SENTIMENT_FROM_SERVER[sentiment];

export const toCommentPreview = (comment: CommentResponse | null): CommentPreview | null =>
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
