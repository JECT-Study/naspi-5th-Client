import type { Comment, CommentResponse } from '@/apis/domains/comment/comment.types';
import { withKstOffset } from '@/utils/date';
import type { NewsDetail, NewsDetailResponse, NewsSentiment, Sentiment } from './news.types';

// 서버(뉴스) → 화면 모양. 일시는 KST에 시간대를 붙여 둔다 (utils/date withKstOffset)
// 다른 도메인 함수는 가져오지 않는 규칙(docs/ARCHITECTURE)이라 댓글 바꾸기는 comment.mapper와 같은 내용을 둔다

const WITHDRAWN_NAME = '탈퇴한 사용자';

const SENTIMENT_FROM_SERVER: Record<NewsSentiment, Sentiment> = {
  POSITIVE: 'BULLISH',
  NEGATIVE: 'BEARISH',
};

export const toSentiment = (sentiment: NewsSentiment): Sentiment =>
  SENTIMENT_FROM_SERVER[sentiment];

const toComment = (comment: CommentResponse): Comment => ({
  commentId: comment.commentId,
  authorName: comment.authorName ?? WITHDRAWN_NAME,
  isMine: comment.mine,
  content: comment.content,
  createdAt: withKstOffset(comment.createdAt),
});

export const toNewsDetail = (news: NewsDetailResponse): NewsDetail => ({
  newsId: news.newsId,
  stockId: news.stockId,
  // 서버 뉴스는 모두 공시를 바탕으로 AI가 쓴 뉴스다
  isAiBriefing: true,
  sentiment: toSentiment(news.sentiment),
  title: news.title,
  content: news.body,
  commentCount: news.commentCount,
  comments: news.comments.map(toComment),
  sourceDisclosure: news.disclosure && {
    disclosureId: news.disclosure.disclosureId,
    title: news.disclosure.title,
  },
  // 서버 뉴스는 모두 공시로 만들어서, 원본 공시가 없으면 삭제된 것이다
  isSourceDeleted: news.disclosure === null,
  createdAt: withKstOffset(news.publishedAt),
});
