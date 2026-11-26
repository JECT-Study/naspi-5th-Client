import { apiClient, unwrap } from '@/apis/client';
import type { ApiResponse } from '@/apis/types';
import type { RoomId } from '@/apis/domains/room/room.types';
import { toStock, toStockDetail } from './stock.mapper';
import type {
  ListStockRequest,
  MemberStockResponse,
  OrderBookResponse,
  Stock,
  StockDetail,
  StockId,
  UpdateStockDescriptionRequest,
} from './stock.types';

// 종목 API. 개발 중 화면 확인은 ?msw=logged-in (msw/handlers)
// 공통 실패 코드: 004 리그에 입장하지 않은 회원, 204 없는 리그, 304 리그에 없는 종목

/** 리그 종목 목록 (이름·소개·시세, 상장 순). 시장 탭, 공시 쓰기의 내 종목 찾기 */
export const getStocks = (roomId: RoomId): Promise<Stock[]> =>
  apiClient
    .get<ApiResponse<MemberStockResponse[]>>(`/api/leagues/${roomId}/stocks`)
    .then(unwrap)
    .then((stocks) => stocks.map(toStock));

/**
 * 종목 화면(시세 요약·호가·종목 정보·주문)용 상세: 종목 개별 조회 + 호가 조회를 함께 부른다
 * 호가는 진행 중인 리그에서만 조회된다 (종목 화면은 진행 중인 리그에서만 열린다). 실시간 갱신은 웹소켓 때
 */
export const getStock = (roomId: RoomId, stockId: StockId): Promise<StockDetail> => {
  const stockPath = `/api/leagues/${roomId}/stocks/${stockId}`;
  return Promise.all([
    apiClient.get<ApiResponse<MemberStockResponse>>(stockPath).then(unwrap),
    apiClient.get<ApiResponse<OrderBookResponse>>(`${stockPath}/orderbook`).then(unwrap),
  ]).then(([stock, orderbook]) => toStockDetail(stock, orderbook));
};

/**
 * 대기실에서 내 종목 상장 (리그당 1인 1종목). 실패 코드: 300 이름 규칙 위반, 301 소개 규칙 위반,
 * 302 같은 리그에 같은 이름, 303 이미 상장함
 */
export const listMyStock = async (roomId: RoomId, request: ListStockRequest): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/stocks`, request);
};

/**
 * 내 종목 소개 수정 (대기실·진행 중, 이름은 대기실에서만 updateMyStock으로).
 * 실패 코드: 301 소개 규칙 위반, 305 내 종목이 아님, 212 이미 종료된 리그
 */
export const updateStockDescription = async (
  roomId: RoomId,
  stockId: StockId,
  request: UpdateStockDescriptionRequest,
): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/stocks/${stockId}/description`, request);
};

/**
 * 대기실에서 내 종목 이름·소개 수정 (시작된 뒤에는 소개만, updateStockDescription).
 * 실패 코드: 300·301 규칙 위반, 302 같은 리그에 같은 이름 (지금 이름 그대로는 가능), 305 내 종목이 아님
 */
export const updateMyStock = async (
  roomId: RoomId,
  stockId: StockId,
  request: ListStockRequest,
): Promise<void> => {
  await apiClient.post(`/api/leagues/${roomId}/stocks/${stockId}/edit`, request);
};
