import type { Comment, CommentTargetType } from '@/apis/domains/comment/comment.types';
import type {
  CreateDisclosureResponse,
  DisclosureDetail,
  NewsStatus,
  Reaction,
} from '@/apis/domains/disclosure/disclosure.types';
import type { DisclosureFeedItem, FeedItem, NewsFeedItem } from '@/apis/domains/feed/feed.types';
import type { NewsDetail } from '@/apis/domains/news/news.types';
import { feedMock } from './feed.mock';
import { marketMock } from './market.mock';
import { createMockApiError } from './mockError';
import { meMock } from './user.mock';

// 공시·뉴스·댓글 mock: 피드 mock(feedMock)을 원본으로 상세·댓글을 만들고,
// 작성·삭제·댓글·반응이 피드 목록의 항목에도 반영되게 한다

const NEWS_GENERATE_DELAY_MS = 4_000;
const WITHDRAWN_USER_NAME = '탈퇴한 사용자';

const image = (color: string) =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='100%' height='100%' fill='%23${color}'/></svg>`;
const SAMPLE_IMAGES = [image('e5e7eb'), image('d1d5db'), image('9ca3af')];

// 내 반응(myReaction)은 피드 항목에 있다 (피드 카드에서도 반응을 바꾼다)
interface MockDisclosureExtra {
  imageUrls: string[];
  newsStatus: NewsStatus;
  relatedNewsId: number | null;
}

interface MockComment extends Omit<Comment, 'isMine'> {
  targetType: CommentTargetType;
  targetId: number;
  authorId: number | null;
}

const myStockId = marketMock.find(({ detail }) => detail.isMine)?.detail.stockId;
const disclosureExtras = new Map<number, MockDisclosureExtra>();
const deletedDisclosures = new Map<number, string>();
/** 뉴스 id → 원문 공시 id */
const newsSources = new Map<number, number>();
let comments: MockComment[] = [];
let nextCommentId = 1_000;
let nextContentId = 1_000;

const isDisclosure = (item: FeedItem): item is DisclosureFeedItem => item.type === 'DISCLOSURE';
const isNews = (item: FeedItem): item is NewsFeedItem => item.type === 'NEWS';
const findDisclosureItem = (id: number) =>
  feedMock.find(
    (item): item is DisclosureFeedItem => isDisclosure(item) && item.disclosureId === id,
  );
const findNewsItem = (id: number) =>
  feedMock.find((item): item is NewsFeedItem => isNews(item) && item.newsId === id);
const contentDeleted = (): never => {
  throw createMockApiError('CONTENT_DELETED', '삭제된 콘텐츠예요.', 404);
};

// 피드 항목에서 상세용 추가 정보와 댓글을 만든다
feedMock.forEach((item, index) => {
  if (isDisclosure(item)) {
    // 바로 다음(더 오래된) 같은 종목 AI 뉴스를 이 공시의 관련 뉴스로 본다
    const next = feedMock[index + 1];
    const relatedNews = next && isNews(next) && next.stockId === item.stockId ? next : null;
    if (relatedNews) newsSources.set(relatedNews.newsId, item.disclosureId);
    disclosureExtras.set(item.disclosureId, {
      imageUrls: item.thumbnailUrl ? SAMPLE_IMAGES : [],
      // 내 공시는 "뉴스 생성 실패 → 다시 시도" 확인용
      newsStatus: relatedNews ? 'PUBLISHED' : item.stockId === myStockId ? 'FAILED' : 'NONE',
      relatedNewsId: relatedNews?.newsId ?? null,
    });
  }
  const targetType = item.type;
  const targetId = isDisclosure(item) ? item.disclosureId : item.newsId;
  Array.from({ length: item.commentCount }, (_, i) => {
    const preview = i === 0 ? item.firstComment : null;
    const authorName = preview?.authorName ?? (i % 2 === 0 ? '송우진' : WITHDRAWN_USER_NAME);
    comments.push({
      commentId: nextCommentId++,
      targetType,
      targetId,
      authorName,
      authorId: authorName === meMock.name ? meMock.userId : null,
      content: preview?.content ?? '좋아요',
      createdAt: preview?.createdAt ?? new Date(Date.now() - (i + 1) * 60_000).toISOString(),
    });
  });
});

const commentsOf = (targetType: CommentTargetType, targetId: number) =>
  comments.filter((comment) => comment.targetType === targetType && comment.targetId === targetId);

// 피드 항목의 댓글 수·첫 번째 댓글을 다시 맞춘다
const syncFeedComments = (targetType: CommentTargetType, targetId: number) => {
  const item = targetType === 'DISCLOSURE' ? findDisclosureItem(targetId) : findNewsItem(targetId);
  if (!item) return;
  const list = commentsOf(targetType, targetId).sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  item.commentCount = list.length;
  const first = list[0];
  item.firstComment = first
    ? {
        commentId: first.commentId,
        authorName: first.authorName,
        content: first.content,
        createdAt: first.createdAt,
      }
    : null;
};

// AI 뉴스가 잠시 뒤 발행된 것으로 친다 (공시 바로 뒤, 피드에 추가)
const publishNewsLater = (disclosureId: number) => {
  setTimeout(() => {
    const disclosure = findDisclosureItem(disclosureId);
    const extra = disclosureExtras.get(disclosureId);
    if (!disclosure || !extra) return;
    const newsId = nextContentId++;
    const news: NewsFeedItem = {
      type: 'NEWS',
      newsId,
      stockId: disclosure.stockId,
      stockName: disclosure.stockName,
      title: `${disclosure.stockName}, ${disclosure.title}`,
      content: `${disclosure.stockName}이(가) "${disclosure.title}" 소식을 전했다.`,
      isAiBriefing: true,
      sentiment: 'BULLISH',
      commentCount: 0,
      firstComment: null,
      createdAt: new Date().toISOString(),
    };
    feedMock.unshift(news);
    newsSources.set(newsId, disclosureId);
    extra.newsStatus = 'PUBLISHED';
    extra.relatedNewsId = newsId;
  }, NEWS_GENERATE_DELAY_MS);
};

export const mockContentServer = {
  getDisclosure: (disclosureId: number): DisclosureDetail => {
    const item = findDisclosureItem(disclosureId);
    const extra = disclosureExtras.get(disclosureId);
    if (!item || !extra) return contentDeleted();
    const relatedNews = extra.relatedNewsId ? findNewsItem(extra.relatedNewsId) : undefined;
    return structuredClone({
      disclosureId,
      stockId: item.stockId,
      stockName: item.stockName,
      isMine: item.stockId === myStockId,
      title: item.title,
      content: item.content,
      imageUrls: extra.imageUrls,
      bullishCount: item.bullishCount,
      bearishCount: item.bearishCount,
      myReaction: item.myReaction,
      commentCount: item.commentCount,
      newsStatus: extra.newsStatus,
      relatedNews: relatedNews
        ? { newsId: relatedNews.newsId, title: relatedNews.title, sentiment: relatedNews.sentiment }
        : null,
      createdAt: item.createdAt,
    });
  },

  getNews: (newsId: number): NewsDetail => {
    const item = findNewsItem(newsId) ?? contentDeleted();
    const sourceId = newsSources.get(newsId);
    const source = sourceId ? findDisclosureItem(sourceId) : undefined;
    return structuredClone({
      newsId,
      stockId: item.stockId,
      stockName: item.stockName,
      isAiBriefing: item.isAiBriefing,
      sentiment: item.sentiment,
      title: item.title,
      content: item.content,
      commentCount: item.commentCount,
      sourceDisclosure: source ? { disclosureId: source.disclosureId, title: source.title } : null,
      isSourceDeleted: sourceId !== undefined && deletedDisclosures.has(sourceId),
      createdAt: item.createdAt,
    });
  },

  createDisclosure: (
    title: string,
    content: string,
    imageCount: number,
  ): CreateDisclosureResponse => {
    const stock = marketMock.find(({ detail }) => detail.isMine)?.detail;
    if (!stock) throw createMockApiError('NOT_FOUND', '내 종목이 없어요.', 404);
    const disclosureId = nextContentId++;
    feedMock.unshift({
      type: 'DISCLOSURE',
      disclosureId,
      stockId: stock.stockId,
      stockName: stock.name,
      title,
      content,
      thumbnailUrl: imageCount > 0 ? SAMPLE_IMAGES[0] : null,
      bullishCount: 0,
      bearishCount: 0,
      myReaction: null,
      commentCount: 0,
      firstComment: null,
      createdAt: new Date().toISOString(),
    });
    disclosureExtras.set(disclosureId, {
      imageUrls: SAMPLE_IMAGES.slice(0, imageCount),
      newsStatus: 'GENERATING',
      relatedNewsId: null,
    });
    publishNewsLater(disclosureId);
    return { disclosureId };
  },

  // 공시를 지워도 이미 발행된 뉴스는 남는다 (서비스 정책 3.1)
  deleteDisclosure: (disclosureId: number) => {
    const index = feedMock.findIndex(
      (item) => isDisclosure(item) && item.disclosureId === disclosureId,
    );
    if (index < 0) return contentDeleted();
    deletedDisclosures.set(disclosureId, feedMock[index].title);
    feedMock.splice(index, 1);
    disclosureExtras.delete(disclosureId);
  },

  retryNews: (disclosureId: number) => {
    const extra = disclosureExtras.get(disclosureId) ?? contentDeleted();
    extra.newsStatus = 'GENERATING';
    publishNewsLater(disclosureId);
  },

  react: (disclosureId: number, reaction: Reaction | null) => {
    const item = findDisclosureItem(disclosureId) ?? contentDeleted();
    if (item.myReaction === 'BULLISH') item.bullishCount -= 1;
    if (item.myReaction === 'BEARISH') item.bearishCount -= 1;
    if (reaction === 'BULLISH') item.bullishCount += 1;
    if (reaction === 'BEARISH') item.bearishCount += 1;
    item.myReaction = reaction;
  },

  getComments: (targetType: CommentTargetType, targetId: number): Comment[] =>
    commentsOf(targetType, targetId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map(({ commentId, authorName, authorId, content, createdAt }) => ({
        commentId,
        authorName: authorId === meMock.userId ? meMock.name : authorName,
        isMine: authorId === meMock.userId,
        content,
        createdAt,
      })),

  addComment: (targetType: CommentTargetType, targetId: number, content: string) => {
    comments.push({
      commentId: nextCommentId++,
      targetType,
      targetId,
      authorName: meMock.name,
      authorId: meMock.userId,
      content,
      createdAt: new Date().toISOString(),
    });
    syncFeedComments(targetType, targetId);
  },

  deleteComment: (commentId: number) => {
    const target = comments.find((comment) => comment.commentId === commentId);
    comments = comments.filter((comment) => comment.commentId !== commentId);
    if (target) syncFeedComments(target.targetType, target.targetId);
  },
};
