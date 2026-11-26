import type { Comment, CommentResponse } from '@/apis/domains/comment/comment.types';
import type { NewsSentiment, Sentiment } from '@/apis/domains/news/news.types';
import { withKstOffset } from '@/utils/date';
import type {
  DisclosureDetail,
  DisclosureDetailResponse,
  DisclosureNewsResponse,
  NewsStatus,
  Reaction,
  ReactionType,
} from './disclosure.types';

// 서버(공시) → 화면 모양. 일시는 KST에 시간대를 붙여 둔다 (utils/date withKstOffset)
// 다른 도메인 함수는 가져오지 않는 규칙(docs/ARCHITECTURE)이라 댓글·뉴스 호재/악재 바꾸기는
// comment.mapper·news.mapper와 같은 내용을 둔다

const WITHDRAWN_NAME = '탈퇴한 사용자';

const toComment = (comment: CommentResponse): Comment => ({
  commentId: comment.commentId,
  authorName: comment.authorName ?? WITHDRAWN_NAME,
  isMine: comment.mine,
  content: comment.content,
  createdAt: withKstOffset(comment.createdAt),
});

const toSentiment = (sentiment: NewsSentiment): Sentiment =>
  sentiment === 'POSITIVE' ? 'BULLISH' : 'BEARISH';

const REACTION_FROM_SERVER: Record<ReactionType, Reaction> = {
  LIKE: 'BULLISH',
  DISLIKE: 'BEARISH',
};
const REACTION_TO_SERVER: Record<Reaction, ReactionType> = {
  BULLISH: 'LIKE',
  BEARISH: 'DISLIKE',
};

export const toReaction = (type: ReactionType | null): Reaction | null =>
  type ? REACTION_FROM_SERVER[type] : null;

export const toReactionType = (reaction: Reaction): ReactionType => REACTION_TO_SERVER[reaction];

// 서버는 발행·실패만 news로 주고, 생성 중·생성 안 함은 news가 null이다
const toNewsStatus = (news: DisclosureNewsResponse | null): NewsStatus =>
  news?.status === 'PUBLISHED' || news?.status === 'FAILED' ? news.status : 'NONE';

export const toDisclosureDetail = (disclosure: DisclosureDetailResponse): DisclosureDetail => {
  const { news, images } = disclosure;
  const newsStatus = toNewsStatus(news);
  return {
    disclosureId: disclosure.disclosureId,
    stockId: disclosure.stockId,
    isMine: disclosure.mine,
    title: disclosure.title,
    content: disclosure.body,
    imageUrls: images.map((image) => image.signedUrl),
    bullishCount: disclosure.likeCount,
    bearishCount: disclosure.dislikeCount,
    myReaction: toReaction(disclosure.myReaction),
    commentCount: disclosure.commentCount,
    comments: disclosure.comments.map(toComment),
    newsStatus,
    relatedNews:
      newsStatus === 'PUBLISHED' && news?.title && news.sentiment
        ? { newsId: news.newsId, title: news.title, sentiment: toSentiment(news.sentiment) }
        : null,
    createdAt: withKstOffset(disclosure.createdAt),
  };
};
