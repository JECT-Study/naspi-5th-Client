import { apiClient, unwrap } from '@/apis/client';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';
import type { ApiResponse } from '@/apis/types';
import { toDisclosureDetail, toReaction, toReactionType } from './disclosure.mapper';
import type {
  CreateDisclosureRequest,
  CreateDisclosureResponse,
  DisclosureDetail,
  DisclosureDetailResponse,
  DisclosureId,
  DisclosureReactionResponse,
  PublishDisclosureResponse,
  Reaction,
  ReactToDisclosureRequest,
} from './disclosure.types';

// 공시 API. 서버 주소에 종목이 들어간다: /api/leagues/{leagueId}/stocks/{stockId}/disclosures/...
// 공통 실패 코드: 607 공시가 없거나 삭제됨, 004 리그에 입장하지 않은 회원 (그 밖의 코드는 함수마다 적는다)
const disclosuresPath = (roomId: RoomId, stockId: StockId) =>
  `/api/leagues/${roomId}/stocks/${stockId}/disclosures`;

const UPLOAD_TIMEOUT_MS = 120_000;

/** 공시 상세 (댓글 전체·AI 뉴스 포함). 종목 이름은 오지 않는다 */
export const getDisclosure = (
  roomId: RoomId,
  stockId: StockId,
  disclosureId: DisclosureId,
): Promise<DisclosureDetail> =>
  apiClient
    .get<ApiResponse<DisclosureDetailResponse>>(
      `${disclosuresPath(roomId, stockId)}/${disclosureId}`,
    )
    .then(unwrap)
    .then(toDisclosureDetail);

/**
 * 공시 작성 (multipart: title, body, images 여러 개. 보낸 순서가 첨부 순서). 내 종목에만 쓸 수 있다
 * 실패: 600 이미지 형식, 601 빈 이미지·50MB 초과, 602 5장 이상, 603 제목, 604 본문, 605 내 종목 아님, 606 진행 중 아님
 */
export const createDisclosure = (
  roomId: RoomId,
  stockId: StockId,
  { title, content, images }: CreateDisclosureRequest,
): Promise<CreateDisclosureResponse> => {
  const form = new FormData();
  form.append('title', title);
  form.append('body', content);
  images.forEach((image) => form.append('images', image));
  return apiClient
    .post<ApiResponse<PublishDisclosureResponse>>(disclosuresPath(roomId, stockId), form, {
      // 사진(1장 최대 50MB, 4장)을 올리는 동안 기본 10초에 끊기지 않게 늘린다
      timeout: UPLOAD_TIMEOUT_MS,
    })
    .then(unwrap)
    .then(({ disclosureId }) => ({ disclosureId }));
};

/** 내 공시 삭제 (댓글도 같이 사라지고, 발행된 뉴스는 남는다). 실패: 608 작성자 아님 */
export const deleteDisclosure = async (
  roomId: RoomId,
  stockId: StockId,
  disclosureId: DisclosureId,
): Promise<void> => {
  await apiClient.post(`${disclosuresPath(roomId, stockId)}/${disclosureId}/delete`);
};

/**
 * 자동 재시도까지 실패한 AI 뉴스를 작성자가 다시 생성 (서비스 정책 3.2). 결과는 공시 상세로 확인한다
 * 실패: 611 작성자 아님, 612 실패한 뉴스가 아님, 613 1분 안에 다시 요청, 614 진행 중 아님, 610 뉴스 없음
 */
export const retryNewsGeneration = async (
  roomId: RoomId,
  stockId: StockId,
  disclosureId: DisclosureId,
): Promise<void> => {
  await apiClient.post(`${disclosuresPath(roomId, stockId)}/${disclosureId}/news/regenerate`);
};

export interface DisclosureReactionResult {
  bullishCount: number;
  bearishCount: number;
  myReaction: Reaction | null;
}

/**
 * 공시 호재·악재 반응 토글: 누른 버튼을 보내면 서버가 등록·취소·변경을 정하고 토글 뒤 집계를 준다
 * (같은 버튼을 다시 누르면 취소, 반대 버튼이면 변경). 실패: 609 진행 중인 리그 아님
 */
export const toggleDisclosureReaction = (
  roomId: RoomId,
  stockId: StockId,
  disclosureId: DisclosureId,
  pressed: Reaction,
): Promise<DisclosureReactionResult> =>
  apiClient
    .post<ApiResponse<DisclosureReactionResponse>>(
      `${disclosuresPath(roomId, stockId)}/${disclosureId}/reaction`,
      { type: toReactionType(pressed) } satisfies ReactToDisclosureRequest,
    )
    .then(unwrap)
    .then((result) => ({
      bullishCount: result.likeCount,
      bearishCount: result.dislikeCount,
      myReaction: toReaction(result.myReaction),
    }));
