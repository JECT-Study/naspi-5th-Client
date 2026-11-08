import { useQuery } from '@tanstack/react-query';
import { roomQueries } from '@/apis/domains/room/room.queries';

// 메인 페이지와 GNB 드로어(나의 리그)가 같이 쓴다
export const useMyRooms = () => useQuery(roomQueries.mine());
