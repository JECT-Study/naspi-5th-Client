import type { RoomId } from '@/apis/domains/room/room.types';
import { mockContentServer } from '@/mocks/content.mock';
import { delay } from '@/mocks/delay';
import type {
  CreateDisclosureRequest,
  CreateDisclosureResponse,
  DisclosureDetail,
  DisclosureId,
  ReactToDisclosureRequest,
} from './disclosure.types';

// TODO: API가 준비되면 각 함수 안쪽을 apiClient 호출로 바꾼다 (ApiResponse<T>로 받고 data만 반환)

export const getDisclosure = async (
  _roomId: RoomId,
  disclosureId: DisclosureId,
): Promise<DisclosureDetail> => {
  await delay(300);
  return mockContentServer.getDisclosure(disclosureId);
};

export const createDisclosure = async (
  _roomId: RoomId,
  request: CreateDisclosureRequest,
): Promise<CreateDisclosureResponse> => {
  await delay(800);
  return mockContentServer.createDisclosure(request.title, request.content, request.images.length);
};

export const deleteDisclosure = async (
  _roomId: RoomId,
  disclosureId: DisclosureId,
): Promise<void> => {
  await delay(300);
  mockContentServer.deleteDisclosure(disclosureId);
};

// 자동 재시도까지 실패한 AI 뉴스를 작성자가 다시 생성 (서비스 정책 3.2)
export const retryNewsGeneration = async (
  _roomId: RoomId,
  disclosureId: DisclosureId,
): Promise<void> => {
  await delay(300);
  mockContentServer.retryNews(disclosureId);
};

export const reactToDisclosure = async (
  _roomId: RoomId,
  disclosureId: DisclosureId,
  request: ReactToDisclosureRequest,
): Promise<void> => {
  await delay(200);
  mockContentServer.react(disclosureId, request.reaction);
};
