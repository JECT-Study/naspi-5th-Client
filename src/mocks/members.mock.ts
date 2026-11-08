// 리그 참여자 mock: 시장 종목, 리그 참여자, 대기실, 피드, 리그 결과가 같은 사람들을 쓴다
// userId 1(김진영)이 나 (user.mock의 meMock)

export interface MockMemberSeed {
  userId: number;
  name: string;
  stockId: number;
  stockName: string;
  description: string;
  basePrice: number;
  /** 상장 완료 시각. 종목 정렬 기준 */
  listedAt: string;
}

export const leagueMembersMock: MockMemberSeed[] = [
  {
    userId: 1,
    name: '김진영',
    stockId: 1,
    stockName: '진영케미칼',
    description: '실험실에서 하루를 보내는 종목',
    basePrice: 10_000,
    listedAt: '2026-11-01T01:00:00Z',
  },
  {
    userId: 4,
    name: '김수빈',
    stockId: 4,
    stockName: '수빈전자',
    description: '오늘도 출근하는 성실한 종목',
    basePrice: 10_000,
    listedAt: '2026-11-01T01:30:00Z',
  },
  {
    userId: 5,
    name: '고관우',
    stockId: 5,
    stockName: '관우건설',
    description: '주말마다 등산 가는 종목',
    basePrice: 9_900,
    listedAt: '2026-11-01T04:00:00Z',
  },
  {
    userId: 6,
    name: '노민영',
    stockId: 6,
    stockName: '민영식품',
    description: '먹는 게 남는 종목',
    basePrice: 10_200,
    listedAt: '2026-11-01T05:00:00Z',
  },
  {
    userId: 2,
    name: '문예림',
    stockId: 2,
    stockName: '예림제약',
    description: '나는 지지 않아 ㅋ 절대절대 지지 않아',
    basePrice: 10_300,
    listedAt: '2026-11-01T03:00:00Z',
  },
  {
    userId: 7,
    name: '송우진',
    stockId: 7,
    stockName: '우진항공',
    description: '여행 가고 싶은 종목',
    basePrice: 10_100,
    listedAt: '2026-11-01T06:00:00Z',
  },
  {
    userId: 3,
    name: '이세영',
    stockId: 3,
    stockName: '세영바이오',
    description: '돈 버는 일상',
    basePrice: 9_800,
    listedAt: '2026-11-01T02:00:00Z',
  },
];

export const findMemberMock = (userId: number) =>
  leagueMembersMock.find((member) => member.userId === userId);
