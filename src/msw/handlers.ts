import type { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import type { SignupRequest } from '@/apis/domains/auth/auth.types';
import type { CreateCommentRequest } from '@/apis/domains/comment/comment.types';
import type { ReactToDisclosureRequest } from '@/apis/domains/disclosure/disclosure.types';
import type {
  CreateLeagueRequest,
  JoinRoomRequest,
  UpdateRoomNameRequest,
} from '@/apis/domains/room/room.types';
import type {
  ListStockRequest,
  UpdateStockDescriptionRequest,
} from '@/apis/domains/stock/stock.types';
import type { UpdateMyNameRequest } from '@/apis/domains/user/user.types';
import type { ApiResponse } from '@/apis/types';
import { mockContentServer } from '@/mocks/content.mock';
import { delay as mockDelay } from '@/mocks/delay';
import { mockStockServer } from '@/mocks/market.mock';
import { mockRoomServer } from '@/mocks/room.mock';
import type { MswScenario } from './scenario';

// 실제 API와 같은 응답을 만든다 (백엔드 Result: { code, message, data }, 비즈니스 실패도 HTTP 200)
// 한 핸들러가 성공·실패를 모두 돌려주므로 응답 타입을 하나(ApiResponse<unknown>)로 맞춘다
type MockResponse = HttpResponse<ApiResponse<unknown>>;
const success = (data: unknown = null): MockResponse =>
  HttpResponse.json<ApiResponse<unknown>>({ code: '000', message: '', data });
const failure = (code: string, message: string, status = 200): MockResponse =>
  HttpResponse.json<ApiResponse<unknown>>({ code, message, data: null }, { status });

/**
 * mocks/의 mock 서버로 응답을 만든다 (아직 service가 직접 쓰는 mock과 같은 상태를 본다)
 * ms만큼 늦게 응답하고(?mock=error면 서버 오류), mock이 던진 실패는 서버 응답 그대로 돌려준다
 */
const fromMock = async (ms: number, run: () => unknown): Promise<MockResponse> => {
  try {
    await mockDelay(ms);
    return success(run());
  } catch (error) {
    const response = (error as AxiosError<ApiResponse<unknown>>).response;
    if (response?.data) return failure(response.data.code, response.data.message, response.status);
    throw error;
  }
};

// 백엔드 ErrorCode 문구 그대로
const unauthorized = () => failure('003', '인증이 필요합니다.', 401);
const serverError = () => failure('999', '서버 내부 오류가 발생했습니다.', 500);
const invalidName = () => failure('101', '이름은 1~5자의 한글만 사용할 수 있습니다.');

// 가입 실패 시나리오 → 서버 응답
const SIGNUP_FAILURES: Partial<Record<MswScenario, () => MockResponse>> = {
  'signup-101': invalidName,
  'signup-100': () => failure('100', '카카오 로그인 후 가입할 수 있습니다.'),
  'signup-102': () => failure('102', '이미 가입한 회원입니다.'),
  'signup-error': serverError,
};

// 로그인 안 한 상태에서 시작하는 시나리오 (나머지는 로그인된 상태에서 시작한다)
const LOGGED_OUT_SCENARIOS: MswScenario[] = [
  'logged-out',
  'signup',
  'signup-101',
  'signup-100',
  'signup-102',
  'signup-error',
];

/**
 * 시나리오별 핸들러. 로그인 상태는 메모리에 두고 실제 서버처럼 바꾼다
 * (가입 → 로그인됨, 로그아웃·탈퇴 → 로그인 안 함, session-expired에서 요청하면 → 로그인 안 함)
 * 새로고침하면 시나리오의 처음 상태로 돌아간다
 */
export const createHandlers = (scenario: MswScenario) => {
  const me = { isLoggedIn: !LOGGED_OUT_SCENARIOS.includes(scenario), name: '김진영' };
  // me-error: 첫 로그인 확인만 실패시켜서 '메인 페이지로 이동'으로 회복되는 것까지 볼 수 있게 한다
  let shouldFailMe = scenario === 'me-error';

  // 로그인이 필요한 요청: 로그인 안 했으면 401. session-expired면 이번 요청에서 세션이 끝난다
  const requireLogin = (handle: () => MockResponse | Promise<MockResponse>) => {
    if (scenario === 'session-expired') me.isLoggedIn = false;
    return me.isLoggedIn ? handle() : unauthorized();
  };

  return [
    http.get('*/api/members/me/name', () => {
      if (shouldFailMe) {
        shouldFailMe = false;
        return serverError();
      }
      return me.isLoggedIn ? success({ name: me.name }) : unauthorized();
    }),

    http.post('*/api/members/signup', async ({ request }) => {
      const failed = SIGNUP_FAILURES[scenario];
      if (failed) return failed();
      if (scenario !== 'signup') return failure('100', '카카오 로그인 후 가입할 수 있습니다.');
      const { name } = (await request.json()) as SignupRequest;
      me.isLoggedIn = true;
      me.name = name;
      return success({ memberId: 7 });
    }),

    http.post('*/api/members/me/name', ({ request }) =>
      requireLogin(async () => {
        if (scenario === 'name-101') return invalidName();
        if (scenario === 'name-error') return serverError();
        const { name } = (await request.json()) as UpdateMyNameRequest;
        me.name = name;
        return success({ name });
      }),
    ),

    // 실제 서버는 로그인 안 한 상태여도 로그아웃을 성공으로 응답한다
    http.post('*/api/auth/logout', () => {
      if (scenario === 'logout-error') return serverError();
      me.isLoggedIn = false;
      return success();
    }),

    http.post('*/api/members/me/withdraw', () =>
      requireLogin(() => {
        if (scenario === 'withdraw-error') return serverError();
        me.isLoggedIn = false;
        return success();
      }),
    ),

    // 리그 (mocks/room.mock). ?mock=empty면 내 리그 없이 시작한다
    http.get('*/api/leagues/me', () =>
      requireLogin(() => fromMock(300, () => mockRoomServer.getMyLeagues())),
    ),

    http.post('*/api/leagues', ({ request }) =>
      requireLogin(async () => {
        const body = (await request.json()) as CreateLeagueRequest;
        return fromMock(600, () => mockRoomServer.createLeague(body));
      }),
    ),

    // 초대 코드는 대소문자를 가리지 않고 앞뒤 공백을 무시한다 (서버와 같게)
    http.get('*/api/leagues/invite-codes/:inviteCode', ({ params }) =>
      requireLogin(() =>
        fromMock(600, () =>
          mockRoomServer.getLeagueInfo(String(params.inviteCode).trim().toUpperCase()),
        ),
      ),
    ),

    http.post('*/api/leagues/join', ({ request }) =>
      requireLogin(async () => {
        const { inviteCode } = (await request.json()) as JoinRoomRequest;
        return fromMock(600, () =>
          mockRoomServer.joinLeague({ inviteCode: inviteCode.trim().toUpperCase() }),
        );
      }),
    ),

    // 리그 상세·대기실 관리 (:leagueId는 숫자)
    http.get('*/api/leagues/:leagueId/detail', ({ params }) =>
      requireLogin(() =>
        fromMock(300, () => mockRoomServer.getLeagueDetail(Number(params.leagueId))),
      ),
    ),

    http.post('*/api/leagues/:leagueId/name', ({ params, request }) =>
      requireLogin(async () => {
        const body = (await request.json()) as UpdateRoomNameRequest;
        return fromMock(300, () => mockRoomServer.renameLeague(Number(params.leagueId), body));
      }),
    ),

    http.post('*/api/leagues/:leagueId/delete', ({ params }) =>
      requireLogin(() => fromMock(300, () => mockRoomServer.deleteLeague(Number(params.leagueId)))),
    ),

    http.post('*/api/leagues/:leagueId/leave', ({ params }) =>
      requireLogin(() => fromMock(300, () => mockRoomServer.leaveLeague(Number(params.leagueId)))),
    ),

    http.post('*/api/leagues/:leagueId/players/:playerId/kick', ({ params }) =>
      requireLogin(() =>
        fromMock(300, () =>
          mockRoomServer.kickPlayer(Number(params.leagueId), Number(params.playerId)),
        ),
      ),
    ),

    http.post('*/api/leagues/:leagueId/start', ({ params }) =>
      requireLogin(() => fromMock(600, () => mockRoomServer.startLeague(Number(params.leagueId)))),
    ),

    // 종목 목록(시세 포함, 상장 순)·소개 수정 (mocks/market.mock, 리그마다 같은 종목)
    http.get('*/api/leagues/:leagueId/stocks', () =>
      requireLogin(() => fromMock(300, () => mockStockServer.getStocks())),
    ),

    http.post('*/api/leagues/:leagueId/stocks/:stockId/description', ({ params, request }) =>
      requireLogin(async () => {
        const { description } = (await request.json()) as UpdateStockDescriptionRequest;
        return fromMock(300, () =>
          mockStockServer.updateDescription(Number(params.stockId), description),
        );
      }),
    ),

    // 종목 상장·대기실 종목 수정
    http.post('*/api/leagues/:leagueId/stocks', ({ params, request }) =>
      requireLogin(async () => {
        const body = (await request.json()) as ListStockRequest;
        return fromMock(600, () => mockRoomServer.listStock(Number(params.leagueId), body));
      }),
    ),

    http.post('*/api/leagues/:leagueId/stocks/:stockId/edit', ({ params, request }) =>
      requireLogin(async () => {
        const body = (await request.json()) as ListStockRequest;
        return fromMock(600, () =>
          mockRoomServer.editStock(Number(params.leagueId), Number(params.stockId), body),
        );
      }),
    ),

    // 리그 피드 (공시 + 뉴스, stockId·type 거르기, 커서 페이징). mocks/content.mock, 리그마다 같은 피드
    http.get('*/api/leagues/:leagueId/feed', ({ request }) =>
      requireLogin(() => {
        const query = new URL(request.url).searchParams;
        const stockId = query.get('stockId');
        const type = query.get('type');
        return fromMock(300, () =>
          mockContentServer.getFeedPage({
            stockId: stockId === null ? undefined : Number(stockId),
            type: type === 'DISCLOSURE' || type === 'NEWS' ? type : undefined,
            cursor: query.get('cursor') ?? undefined,
            size: Number(query.get('size') ?? 5),
          }),
        );
      }),
    ),

    // 종목별 공시 목록·뉴스 목록 (종목 정보 화면). 같은 피드 mock을 종목·종류로 거른다
    ...(['disclosures', 'news'] as const).map((path) =>
      http.get(`*/api/leagues/:leagueId/stocks/:stockId/${path}`, ({ params, request }) =>
        requireLogin(() => {
          const query = new URL(request.url).searchParams;
          return fromMock(300, () =>
            mockContentServer.getFeedPage({
              stockId: Number(params.stockId),
              type: path === 'disclosures' ? 'DISCLOSURE' : 'NEWS',
              cursor: query.get('cursor') ?? undefined,
              size: Number(query.get('size') ?? 20),
            }),
          );
        }),
      ),
    ),

    // 공시 상세·작성(multipart)·삭제·뉴스 다시 생성
    http.get('*/api/leagues/:leagueId/stocks/:stockId/disclosures/:disclosureId', ({ params }) =>
      requireLogin(() =>
        fromMock(300, () => mockContentServer.getDisclosureDetail(Number(params.disclosureId))),
      ),
    ),

    http.post('*/api/leagues/:leagueId/stocks/:stockId/disclosures', ({ params, request }) =>
      requireLogin(async () => {
        const form = await request.formData();
        return fromMock(800, () =>
          mockContentServer.publishDisclosure(
            Number(params.stockId),
            String(form.get('title') ?? ''),
            String(form.get('body') ?? ''),
            form.getAll('images').length,
          ),
        );
      }),
    ),

    http.post(
      '*/api/leagues/:leagueId/stocks/:stockId/disclosures/:disclosureId/delete',
      ({ params }) =>
        requireLogin(() =>
          fromMock(300, () => mockContentServer.deleteDisclosure(Number(params.disclosureId))),
        ),
    ),

    http.post(
      '*/api/leagues/:leagueId/stocks/:stockId/disclosures/:disclosureId/news/regenerate',
      ({ params }) =>
        requireLogin(() =>
          fromMock(300, () => mockContentServer.regenerateNews(Number(params.disclosureId))),
        ),
    ),

    // 뉴스 상세
    http.get('*/api/leagues/:leagueId/stocks/:stockId/news/:newsId', ({ params }) =>
      requireLogin(() =>
        fromMock(300, () => mockContentServer.getNewsDetail(Number(params.newsId))),
      ),
    ),

    // 공시 댓글·뉴스 댓글 (목록·작성·삭제)
    ...(['disclosures', 'news'] as const).flatMap((path) => {
      const targetType = path === 'disclosures' ? 'DISCLOSURE' : 'NEWS';
      const commentsPath = `*/api/leagues/:leagueId/stocks/:stockId/${path}/:targetId/comments`;
      return [
        http.get(commentsPath, ({ params }) =>
          requireLogin(() =>
            fromMock(300, () => mockContentServer.getComments(targetType, Number(params.targetId))),
          ),
        ),
        http.post(commentsPath, ({ params, request }) =>
          requireLogin(async () => {
            const { content } = (await request.json()) as CreateCommentRequest;
            return fromMock(300, () =>
              mockContentServer.writeComment(targetType, Number(params.targetId), content),
            );
          }),
        ),
        http.post(`${commentsPath}/:commentId/delete`, ({ params }) =>
          requireLogin(() =>
            fromMock(300, () =>
              mockContentServer.deleteComment(
                targetType,
                Number(params.targetId),
                Number(params.commentId),
              ),
            ),
          ),
        ),
      ];
    }),

    // 공시 반응 토글 (누른 버튼 LIKE·DISLIKE)
    http.post(
      '*/api/leagues/:leagueId/stocks/:stockId/disclosures/:disclosureId/reaction',
      ({ params, request }) =>
        requireLogin(async () => {
          const { type } = (await request.json()) as ReactToDisclosureRequest;
          return fromMock(200, () =>
            mockContentServer.toggleReaction(Number(params.disclosureId), type),
          );
        }),
    ),
  ];
};
