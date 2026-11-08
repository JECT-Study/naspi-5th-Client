import { useParams } from 'react-router';
import type { RoomId } from '@/apis/domains/room/room.types';

// 리그 안 화면 주소(/leagues/:leagueId/...)의 리그 id
export const useRoomId = (): RoomId => Number(useParams().leagueId);
