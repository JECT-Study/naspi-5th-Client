import { create } from 'zustand';
import type { OrderSide } from '@/apis/domains/order/order.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import type { StockId } from '@/apis/domains/stock/stock.types';

/** 작업형 화면 (화면설계서 공통 4-4). 주소 없이 지금 화면 위에 덮어 띄운다 */
export type Overlay =
  | { type: 'leagueCreate' }
  | { type: 'leagueJoin'; inviteCode?: string }
  | { type: 'stockListing'; roomId: RoomId }
  | { type: 'order'; roomId: RoomId; stockId: StockId; side: OrderSide }
  | { type: 'disclosureCreate'; roomId: RoomId };

interface OverlayState {
  overlay: Overlay | null;
  setOverlay: (overlay: Overlay) => void;
  clearOverlay: () => void;
}

const initialState = { overlay: null };

// 여는 곳(페이지, 드로어)과 그리는 곳(AppLayout)이 달라서 스토어로 공유한다
// 열고 닫기는 기록(뒤로 가기)과 맞춰야 하므로 직접 부르지 말고 hooks/useOverlay를 쓴다
export const useOverlayStore = create<OverlayState>((set) => ({
  ...initialState,
  setOverlay: (overlay) => set({ overlay }),
  clearOverlay: () => set(initialState),
}));
