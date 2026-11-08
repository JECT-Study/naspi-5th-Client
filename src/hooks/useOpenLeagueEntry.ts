import { MAX_ACTIVE_ROOMS, isActiveRoomLimitReached } from '@/apis/domains/room/room.utils';
import { notify } from '@/libs/notify';
import { useMyRooms } from './useMyRooms';
import { useOpenOverlay } from './useOverlay';

export type LeagueEntry = 'leagueCreate' | 'leagueJoin';

/**
 * 새 리그 만들기 / 코드로 참여 오버레이 열기 (메인 +, 메인 빈 화면, GNB 드로어, 리그 결과)
 * 진행 중·대기 중 리그가 이미 5개면 열지 않고 리그 개수 제한 토스트 (메인 1-1, 서비스 정책)
 * 내 리그 목록을 아직 못 받았으면 일단 열고, 서버가 거절하면 오버레이가 같은 토스트를 띄운다
 */
export const useOpenLeagueEntry = () => {
  const openOverlay = useOpenOverlay();
  const { data: rooms } = useMyRooms();

  return (type: LeagueEntry) => {
    if (rooms && isActiveRoomLimitReached(rooms)) {
      notify.error(`리그는 동시에 ${MAX_ACTIVE_ROOMS}개까지만 진행할 수 있어요.`);
      return;
    }
    openOverlay({ type });
  };
};
