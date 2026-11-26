import type { CommentResponse, CommentTargetType } from '@/apis/domains/comment/comment.types';
import type {
  DisclosureDetailResponse,
  DisclosureImageResponse,
  DisclosureNewsResponse,
  DisclosureReactionResponse,
  PublishDisclosureResponse,
  Reaction,
  ReactionType,
  RegeneratedNewsResponse,
} from '@/apis/domains/disclosure/disclosure.types';
import type {
  CommentPreview,
  DisclosureFeedItem,
  FeedItem,
  FeedItemResponse,
  FeedPageResponse,
  FeedQuery,
  NewsFeedItem,
} from '@/apis/domains/feed/feed.types';
import type { NewsDetailResponse } from '@/apis/domains/news/news.types';
import { startsWithNoFeed } from './delay';
import { feedMock, SAMPLE_IMAGES } from './feed.mock';
import { marketMock } from './market.mock';
import { createMockApiError } from './mockError';
import { meMock } from './user.mock';

// 공시·뉴스·댓글 mock 서버 (msw/handlers가 서버 응답 모양으로 쓴다)
// 피드 mock(feedMock)을 원본으로 상세·댓글을 만들고, 작성·삭제·댓글·반응이 피드 목록의 항목에도 반영되게 한다

const NEWS_GENERATE_DELAY_MS = 4_000;
const NEWS_RETRY_INTERVAL_MS = 60_000;
const WITHDRAWN_USER_NAME = '탈퇴한 사용자';
// 이미지 주소는 서버처럼 5분 뒤 만료로 적는다 (mock 주소는 만료되지 않는다)
const IMAGE_URL_TTL_MS = 5 * 60_000;

// 서버처럼 보이는 글자 단위로 센다 (mocks는 앱 코드의 함수를 가져오지 않아 따로 둔다)
const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
const countGraphemes = (text: string) => Array.from(segmenter.segment(text)).length;

/** 서버의 뉴스 상태. 생성 중(PENDING)·생성 안 함(SKIPPED)은 상세에서 news가 null이다 */
type MockNewsStatus = 'PENDING' | 'PUBLISHED' | 'FAILED' | 'SKIPPED';

// 내 반응(myReaction)은 피드 항목에 있다 (피드 카드에서도 반응을 바꾼다)
interface MockDisclosureExtra {
  newsStatus: MockNewsStatus;
  /** 발행된 뉴스 id, 또는 실패한 뉴스의 id */
  newsId: number | null;
}

interface MockComment {
  commentId: number;
  targetType: CommentTargetType;
  targetId: number;
  authorName: string;
  authorId: number | null;
  content: string;
  createdAt: string;
}

const myStockId = marketMock.find(({ detail }) => detail.isMine)?.detail.stockId;
const disclosureExtras = new Map<number, MockDisclosureExtra>();
/** 뉴스 id → 원문 공시 id */
const newsSources = new Map<number, number>();
/** 뉴스 다시 생성을 마지막으로 요청한 시각 (공시 id별, 1분에 한 번) */
const lastRetryAt = new Map<number, number>();
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

// 서버처럼 비즈니스 실패도 HTTP 200 + code
const fail = (code: string, message: string): never => {
  throw createMockApiError(code, message, 200);
};
const disclosureNotFound = () => fail('607', '공시를 찾을 수 없습니다.');
const newsNotFound = () => fail('610', '뉴스를 찾을 수 없습니다.');

// 피드 항목에서 상세용 추가 정보와 댓글을 만든다
feedMock.forEach((item, index) => {
  if (isDisclosure(item)) {
    // 바로 다음(더 오래된) 같은 종목 AI 뉴스를 이 공시의 관련 뉴스로 본다
    const next = feedMock[index + 1];
    const relatedNews = next && isNews(next) && next.stockId === item.stockId ? next : null;
    if (relatedNews) newsSources.set(relatedNews.newsId, item.disclosureId);
    // 내 공시는 "뉴스 생성 실패 → 다시 시도" 확인용
    const isMyFailed = !relatedNews && item.stockId === myStockId;
    disclosureExtras.set(item.disclosureId, {
      newsStatus: relatedNews ? 'PUBLISHED' : isMyFailed ? 'FAILED' : 'SKIPPED',
      newsId: relatedNews?.newsId ?? (isMyFailed ? nextContentId++ : null),
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

const toServerReaction = (reaction: Reaction | null): ReactionType | null =>
  reaction === 'BULLISH' ? 'LIKE' : reaction === 'BEARISH' ? 'DISLIKE' : null;

const toServerPreview = (comment: CommentPreview | null): CommentResponse | null =>
  comment && {
    commentId: comment.commentId,
    content: comment.content,
    authorPlayerId: 0,
    authorName: comment.authorName,
    mine: comment.authorName === meMock.name,
    createdAt: comment.createdAt,
  };

const toServerComment = (comment: MockComment): CommentResponse => ({
  commentId: comment.commentId,
  content: comment.content,
  authorPlayerId: comment.authorId ?? 0,
  authorName: comment.authorId === meMock.userId ? meMock.name : comment.authorName,
  mine: comment.authorId === meMock.userId,
  createdAt: comment.createdAt,
});

const toServerImages = (imageUrls: string[]): DisclosureImageResponse[] => {
  const expiresAt = new Date(Date.now() + IMAGE_URL_TTL_MS).toISOString();
  return imageUrls.map((signedUrl, index) => ({ imageId: index + 1, signedUrl, expiresAt }));
};

const toServerFeedItem = (item: FeedItem): FeedItemResponse => {
  const base = {
    stockId: item.stockId,
    stockName: item.stockName,
    title: item.title,
    body: item.content,
    tradingDay: 1,
    commentCount: item.commentCount,
    previewComment: toServerPreview(item.firstComment),
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
  return {
    ...base,
    type: 'DISCLOSURE',
    disclosureId: item.disclosureId,
    createdAt: item.createdAt,
    authorPlayerId: 0,
    mine: item.stockId === myStockId,
    images: toServerImages(item.imageUrls),
    likeCount: item.bullishCount,
    dislikeCount: item.bearishCount,
    myReaction: toServerReaction(item.myReaction),
  };
};

// 상세의 news: 발행·실패만 주고 생성 중·생성 안 함은 null (Swagger)
const toServerNews = (extra: MockDisclosureExtra): DisclosureNewsResponse | null => {
  if (extra.newsStatus === 'FAILED' && extra.newsId !== null) {
    return { newsId: extra.newsId, status: 'FAILED', title: null, body: null, sentiment: null };
  }
  const news =
    extra.newsStatus === 'PUBLISHED' && extra.newsId !== null
      ? findNewsItem(extra.newsId)
      : undefined;
  return news
    ? {
        newsId: news.newsId,
        status: 'PUBLISHED',
        title: news.title,
        body: news.content,
        sentiment: news.sentiment === 'BULLISH' ? 'POSITIVE' : 'NEGATIVE',
      }
    : null;
};

const sortedCommentsOf = (targetType: CommentTargetType, targetId: number) =>
  comments
    .filter((comment) => comment.targetType === targetType && comment.targetId === targetId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

// 피드 항목의 댓글 수·첫 번째 댓글을 다시 맞춘다
const syncFeedComments = (targetType: CommentTargetType, targetId: number) => {
  const item = targetType === 'DISCLOSURE' ? findDisclosureItem(targetId) : findNewsItem(targetId);
  if (!item) return;
  const list = sortedCommentsOf(targetType, targetId);
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

// 댓글이 달린 공시·뉴스가 있는지 확인한다 (없으면 607·610)
const assertCommentTarget = (targetType: CommentTargetType, targetId: number) => {
  if (targetType === 'DISCLOSURE' && !findDisclosureItem(targetId)) disclosureNotFound();
  if (targetType === 'NEWS' && !findNewsItem(targetId)) newsNotFound();
};

// AI 뉴스가 잠시 뒤 발행된 것으로 친다 (피드 맨 위에 추가)
const publishNewsLater = (disclosureId: number) => {
  setTimeout(() => {
    const disclosure = findDisclosureItem(disclosureId);
    const extra = disclosureExtras.get(disclosureId);
    if (!disclosure || !extra) return;
    const newsId = nextContentId++;
    feedMock.unshift({
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
    });
    newsSources.set(newsId, disclosureId);
    extra.newsStatus = 'PUBLISHED';
    extra.newsId = newsId;
  }, NEWS_GENERATE_DELAY_MS);
};

export const mockContentServer = {
  /** GET /api/leagues/{leagueId}/feed (종목별 목록도 같이 쓴다). 커서는 목록 위치 (실제 형식은 서버가 정한다) */
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

  /** GET .../disclosures/{disclosureId} */
  getDisclosureDetail: (disclosureId: number): DisclosureDetailResponse => {
    const item = findDisclosureItem(disclosureId) ?? disclosureNotFound();
    const extra = disclosureExtras.get(disclosureId) ?? disclosureNotFound();
    return structuredClone({
      disclosureId,
      stockId: item.stockId,
      title: item.title,
      body: item.content,
      tradingDay: 1,
      createdAt: item.createdAt,
      authorPlayerId: 0,
      mine: item.stockId === myStockId,
      images: toServerImages(item.imageUrls),
      likeCount: item.bullishCount,
      dislikeCount: item.bearishCount,
      myReaction: toServerReaction(item.myReaction),
      commentCount: item.commentCount,
      comments: sortedCommentsOf('DISCLOSURE', disclosureId).map(toServerComment),
      news: toServerNews(extra),
    });
  },

  /** POST .../stocks/{stockId}/disclosures (multipart). 사진 내용은 보지 않고 장수만큼 샘플 사진을 붙인다 */
  publishDisclosure: (
    stockId: number,
    title: string,
    body: string,
    imageCount: number,
  ): PublishDisclosureResponse => {
    const stock = marketMock.find(({ detail }) => detail.stockId === stockId)?.detail;
    if (!stock?.isMine) fail('605', '본인이 상장한 종목에만 공시를 작성할 수 있습니다.');
    if (imageCount > 4) fail('602', '이미지는 최대 4개까지 첨부할 수 있습니다.');
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || countGraphemes(trimmedTitle) > 30) fail('603', '제목은 1~30자입니다.');
    if (!trimmedBody || countGraphemes(trimmedBody) > 300) fail('604', '본문은 1~300자입니다.');
    const disclosureId = nextContentId++;
    const createdAt = new Date().toISOString();
    feedMock.unshift({
      type: 'DISCLOSURE',
      disclosureId,
      stockId,
      stockName: stock?.name ?? '',
      title: trimmedTitle,
      content: trimmedBody,
      imageUrls: SAMPLE_IMAGES.slice(0, imageCount),
      bullishCount: 0,
      bearishCount: 0,
      myReaction: null,
      commentCount: 0,
      firstComment: null,
      createdAt,
    });
    disclosureExtras.set(disclosureId, { newsStatus: 'PENDING', newsId: null });
    publishNewsLater(disclosureId);
    return {
      disclosureId,
      stockId,
      title: trimmedTitle,
      body: trimmedBody,
      tradingDay: 1,
      createdAt,
      imageIds: Array.from({ length: imageCount }, (_, index) => index + 1),
    };
  },

  /** POST .../disclosures/{disclosureId}/delete. 공시를 지워도 이미 발행된 뉴스는 남는다 (서비스 정책 3.1) */
  deleteDisclosure: (disclosureId: number): null => {
    const index = feedMock.findIndex(
      (item) => isDisclosure(item) && item.disclosureId === disclosureId,
    );
    if (index < 0) return disclosureNotFound();
    if (feedMock[index].stockId !== myStockId) fail('608', '작성자만 삭제할 수 있습니다.');
    feedMock.splice(index, 1);
    disclosureExtras.delete(disclosureId);
    comments = comments.filter(
      (comment) => !(comment.targetType === 'DISCLOSURE' && comment.targetId === disclosureId),
    );
    return null;
  },

  /** POST .../disclosures/{disclosureId}/news/regenerate: 실패한 뉴스만, 작성자만, 1분에 한 번 */
  regenerateNews: (disclosureId: number): RegeneratedNewsResponse => {
    const item = findDisclosureItem(disclosureId) ?? disclosureNotFound();
    const extra = disclosureExtras.get(disclosureId) ?? disclosureNotFound();
    if (item.stockId !== myStockId) fail('611', '공시 작성자만 요청할 수 있습니다.');
    if (extra.newsId === null) fail('610', '공시에 뉴스가 없습니다.');
    if (extra.newsStatus !== 'FAILED') fail('612', '생성에 실패한 뉴스가 아닙니다.');
    const now = Date.now();
    if (now - (lastRetryAt.get(disclosureId) ?? 0) < NEWS_RETRY_INTERVAL_MS) {
      fail('613', '잠시 후 다시 시도해 주세요.');
    }
    lastRetryAt.set(disclosureId, now);
    extra.newsStatus = 'PENDING';
    publishNewsLater(disclosureId);
    return { newsId: extra.newsId ?? 0, status: 'PENDING' };
  },

  /** POST .../disclosures/{disclosureId}/reaction: 누른 버튼으로 토글 (같으면 취소, 다르면 등록·변경) */
  toggleReaction: (disclosureId: number, pressed: ReactionType): DisclosureReactionResponse => {
    const item = findDisclosureItem(disclosureId) ?? disclosureNotFound();
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

  /** GET .../news/{newsId}. 원본 공시가 지워졌으면 disclosure가 null */
  getNewsDetail: (newsId: number): NewsDetailResponse => {
    const item = findNewsItem(newsId) ?? newsNotFound();
    const sourceId = newsSources.get(newsId);
    const source = sourceId === undefined ? undefined : findDisclosureItem(sourceId);
    return structuredClone({
      newsId,
      stockId: item.stockId,
      title: item.title,
      body: item.content,
      sentiment: item.sentiment === 'BULLISH' ? 'POSITIVE' : 'NEGATIVE',
      tradingDay: 1,
      createdAt: item.createdAt,
      publishedAt: item.createdAt,
      commentCount: item.commentCount,
      comments: sortedCommentsOf('NEWS', newsId).map(toServerComment),
      disclosure: source
        ? {
            disclosureId: source.disclosureId,
            title: source.title,
            body: source.content,
            createdAt: source.createdAt,
          }
        : null,
    });
  },

  /** GET .../{disclosures|news}/{id}/comments (오래된 순) */
  getComments: (targetType: CommentTargetType, targetId: number): CommentResponse[] => {
    assertCommentTarget(targetType, targetId);
    return sortedCommentsOf(targetType, targetId).map(toServerComment);
  },

  /** POST .../{disclosures|news}/{id}/comments */
  writeComment: (
    targetType: CommentTargetType,
    targetId: number,
    content: string,
  ): CommentResponse => {
    assertCommentTarget(targetType, targetId);
    const trimmed = content.trim();
    if (!trimmed || countGraphemes(trimmed) > 100) fail('615', '댓글은 1~100자입니다.');
    const comment: MockComment = {
      commentId: nextCommentId++,
      targetType,
      targetId,
      authorName: meMock.name,
      authorId: meMock.userId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    comments.push(comment);
    syncFeedComments(targetType, targetId);
    return toServerComment(comment);
  },

  /** POST .../{disclosures|news}/{id}/comments/{commentId}/delete: 내 댓글만 */
  deleteComment: (targetType: CommentTargetType, targetId: number, commentId: number): null => {
    assertCommentTarget(targetType, targetId);
    const target = comments.find(
      (comment) =>
        comment.commentId === commentId &&
        comment.targetType === targetType &&
        comment.targetId === targetId,
    );
    if (!target) return fail('617', '댓글을 찾을 수 없습니다.');
    if (target.authorId !== meMock.userId) fail('618', '작성자만 삭제할 수 있습니다.');
    comments = comments.filter((comment) => comment.commentId !== commentId);
    syncFeedComments(targetType, targetId);
    return null;
  },
};
