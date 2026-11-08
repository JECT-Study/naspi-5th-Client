import { queryOptions } from '@tanstack/react-query';
import type { RoomId } from '@/apis/domains/room/room.types';
import { getDisclosure } from './disclosure.service';
import type { DisclosureId } from './disclosure.types';

export const disclosureKeys = {
  room: (roomId: RoomId) => ['rooms', roomId, 'disclosures'] as const,
  detail: (roomId: RoomId, disclosureId: DisclosureId) =>
    [...disclosureKeys.room(roomId), disclosureId] as const,
};

export const disclosureQueries = {
  detail: (roomId: RoomId, disclosureId: DisclosureId) =>
    queryOptions({
      queryKey: disclosureKeys.detail(roomId, disclosureId),
      queryFn: () => getDisclosure(roomId, disclosureId),
    }),
};
