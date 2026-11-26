import type { Comment, CommentTargetType } from '@/apis/domains/comment/comment.types';
import type {
  CreateDisclosureResponse,
  DisclosureDetail,
  NewsStatus,
  Reaction,
} from '@/apis/domains/disclosure/disclosure.types';
import type {
  CommentPreview,
  CommentResponse,
  DisclosureFeedItem,
  DisclosureReactionResponse,
  FeedItem,
  FeedItemResponse,
  FeedPageResponse,
  FeedQuery,
  NewsFeedItem,
  ReactionType,
} from '@/apis/domains/feed/feed.types';
import type { NewsDetail } from '@/apis/domains/news/news.types';
import { startsWithNoFeed } from './delay';
import { feedMock, SAMPLE_IMAGES } from './feed.mock';
import { marketMock } from './market.mock';
import { createMockApiError } from './mockError';
import { meMock } from './user.mock';

// 공시·뉴스·댓글 mock: 피드 mock(feedMock)을 원본으로 상세·댓글을 만들고,
// 작성·삭제·댓글·반응이 피드 목록의 항목에도 반영되게 한다

const NEWS_GENERATE_DELAY_MS = 4_000;
const WITHDRAWN_USER_NAME = '탈퇴한 사용자';

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
      imageUrls: item.imageUrls,
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

// ── 화면 모양 mock → 서버 응답 모양 ──

// 서버처럼 비즈니스 실패도 HTTP 200 + code
const fail = (code: string, message: string): never => {
  throw createMockApiError(code, message, 200);
};

const toServerReaction = (reaction: Reaction | null): ReactionType | null =>
  reaction === 'BULLISH' ? 'LIKE' : reaction === 'BEARISH' ? 'DISLIKE' : null;

const toServerComment = (comment: CommentPreview | null): CommentResponse | null =>
  comment && {
    commentId: comment.commentId,
    content: comment.content,
    authorPlayerId: 0,
    authorName: comment.authorName,
    mine: comment.authorName === meMock.name,
    createdAt: comment.createdAt,
  };

// 이미지 주소는 서버처럼 5분 뒤 만료로 적는다 (mock 주소는 만료되지 않는다)
const IMAGE_URL_TTL_MS = 5 * 60_000;

const toServerFeedItem = (item: FeedItem): FeedItemResponse => {
  const base = {
    stockId: item.stockId,
    stockName: item.stockName,
    title: item.title,
    body: item.content,
    tradingDay: 1,
    commentCount: item.commentCount,
    previewComment: toServerComment(item.firstComment),
  };
  if (isNews(item)) {
    return {
      ...base,
      type: 'NEWS',
      newsId: item.newsId,
      sentiment: item.sentiment === 'BULLISH' ? 'POSITIVE' : 'NEGATIVE',
      createdAt: item.createdAt,
      publishedAt: item.createdAt,
    };
  }
  const expiresAt = new Date(Date.now() + IMAGE_URL_TTL_MS).toISOString();
  return {
    ...base,
    type: 'DISCLOSURE',
    disclosureId: item.disclosureId,
    createdAt: item.createdAt,
    authorPlayerId: 0,
    mine: item.stockId === myStockId,
    images: item.imageUrls.map((signedUrl, index) => ({
      imageId: index + 1,
      signedUrl,
      expiresAt,
    })),
    likeCount: item.bullishCount,
    dislikeCount: item.bearishCount,
    myReaction: toServerReaction(item.myReaction),
  };
};

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
      imageUrls: SAMPLE_IMAGES.slice(0, imageCount),
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

  // ── 서버 모양 (msw/handlers가 쓴다) ──

  /** GET /api/leagues/{leagueId}/feed. 커서는 목록 위치 (실제 형식은 서버가 정한다) */
  getFeedPage: ({ stockId, type, cursor, size }: FeedQuery): FeedPageResponse => {
    const matched = startsWithNoFeed
      ? []
      : feedMock.filter(
          (item) =>
            (stockId === undefined || item.stockId === stockId) &&
            (type === undefined || item.type === type),
        );
    const start = cursor ? Number(cursor) : 0;
    if (Number.isNaN(start)) fail('002', '요청 값이 올바르지 않습니다.');
    const end = start + size;
    return structuredClone({
      items: matched.slice(start, end).map(toServerFeedItem),
      nextCursor: end < matched.length ? String(end) : null,
    });
  },

  /** POST .../disclosures/{disclosureId}/reaction: 누른 버튼으로 토글 (같으면 취소, 다르면 등록·변경) */
  toggleReaction: (disclosureId: number, pressed: ReactionType): DisclosureReactionResponse => {
    const item = findDisclosureItem(disclosureId) ?? fail('607', '공시를 찾을 수 없습니다.');
    const reaction: Reaction = pressed === 'LIKE' ? 'BULLISH' : 'BEARISH';
    const next = item.myReaction === reaction ? null : reaction;
    if (item.myReaction === 'BULLISH') item.bullishCount -= 1;
    if (item.myReaction === 'BEARISH') item.bearishCount -= 1;
    if (next === 'BULLISH') item.bullishCount += 1;
    if (next === 'BEARISH') item.bearishCount += 1;
    item.myReaction = next;
    return {
      disclosureId,
      likeCount: item.bullishCount,
      dislikeCount: item.bearishCount,
      myReaction: toServerReaction(next),
    };
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
