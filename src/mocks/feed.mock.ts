import type { FeedItem } from '@/apis/domains/feed/feed.types';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

const THUMBNAIL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='112' height='112'><rect width='100%' height='100%' fill='%23e5e7eb'/></svg>";

const LONG_CONTENT =
  '오늘 아침에 일찍 일어나서 운동을 다녀왔습니다. 앞으로 매일 아침 운동을 하면서 체력을 키워 나갈 예정이니 많은 관심 부탁드립니다.';

const FEED_TEMPLATES: FeedItem[] = [
  {
    type: 'DISCLOSURE',
    disclosureId: 1,
    stockId: 2,
    stockName: '예림제약',
    title: '아침 운동 시작',
    content: LONG_CONTENT,
    thumbnailUrl: THUMBNAIL,
    bullishCount: 3,
    bearishCount: 1,
    myReaction: null,
    commentCount: 3,
    firstComment: {
      commentId: 1,
      authorName: '김수빈',
      content: '작심삼일 아니고?',
      createdAt: minutesAgo(1),
    },
    createdAt: minutesAgo(1),
  },
  {
    type: 'DISCLOSURE',
    disclosureId: 2,
    stockId: 3,
    stockName: '세영바이오',
    title: '신제품 개발 착수',
    content: LONG_CONTENT,
    thumbnailUrl: null,
    bullishCount: 3,
    bearishCount: 0,
    myReaction: null,
    commentCount: 0,
    firstComment: null,
    createdAt: minutesAgo(8),
  },
  {
    type: 'NEWS',
    newsId: 1,
    stockId: 3,
    stockName: '세영바이오',
    title: '세영바이오, 신제품 개발 본격화',
    content: '세영바이오가 신제품 개발에 착수했다고 밝혔다. 업계에서는 실적 개선을 기대하고 있다.',
    isAiBriefing: true,
    sentiment: 'BULLISH',
    commentCount: 2,
    firstComment: {
      // 내 댓글: 댓글 삭제 확인용
      commentId: 2,
      authorName: '김진영',
      content: '기대됩니다. 오늘 바로 매수하러 갑니다.',
      createdAt: minutesAgo(30),
    },
    createdAt: minutesAgo(120),
  },
  {
    type: 'DISCLOSURE',
    disclosureId: 3,
    stockId: 3,
    stockName: '세영바이오',
    title: '주말 계획 공유',
    content: LONG_CONTENT,
    thumbnailUrl: null,
    bullishCount: 0,
    bearishCount: 0,
    myReaction: null,
    commentCount: 0,
    firstComment: null,
    createdAt: minutesAgo(130),
  },
  {
    // 내 종목(진영케미칼)의 공시: 삭제, 뉴스 다시 생성 확인용
    type: 'DISCLOSURE',
    disclosureId: 4,
    stockId: 1,
    stockName: '진영케미칼',
    title: '오늘의 실험 기록',
    content: LONG_CONTENT,
    thumbnailUrl: THUMBNAIL,
    bullishCount: 1,
    bearishCount: 2,
    myReaction: null,
    commentCount: 1,
    firstComment: {
      commentId: 3,
      authorName: '이세영',
      content: '오늘도 성실하네요.',
      createdAt: minutesAgo(5),
    },
    createdAt: minutesAgo(10),
  },
  {
    type: 'DISCLOSURE',
    disclosureId: 5,
    stockId: 4,
    stockName: '수빈전자',
    title: '야근 탈출 선언',
    content: LONG_CONTENT,
    thumbnailUrl: null,
    bullishCount: 4,
    bearishCount: 1,
    myReaction: null,
    commentCount: 2,
    firstComment: {
      commentId: 4,
      authorName: '노민영',
      content: '오늘은 칼퇴 가능?',
      createdAt: minutesAgo(15),
    },
    createdAt: minutesAgo(20),
  },
];

// 페이징 확인용 25건 (10건씩 3페이지). 최신순이라 뒤로 갈수록 오래된 글
export const feedMock: FeedItem[] = Array.from({ length: 25 }, (_, i) => {
  const template = FEED_TEMPLATES[i % FEED_TEMPLATES.length];
  const common = { title: `${template.title} ${i + 1}`, createdAt: minutesAgo(i * 50) };
  return template.type === 'NEWS'
    ? { ...template, ...common, newsId: i + 1 }
    : { ...template, ...common, disclosureId: i + 1 };
});
