import { create } from 'zustand';

type GnbModal = 'logout' | 'withdraw';

interface GnbDrawerState {
  isOpen: boolean;
  /** 드로어에서 연 모달. 드로어는 닫히고 모달만 남는다 */
  modal: GnbModal | null;
  openGnbDrawer: () => void;
  closeGnbDrawer: () => void;
  openGnbModal: (modal: GnbModal) => void;
  closeGnbModal: () => void;
  clearGnbDrawer: () => void;
}

const initialState = { isOpen: false, modal: null };

// 햄버거 버튼은 각 페이지 상단바에, 드로어와 드로어에서 여는 모달은 AuthLayout에 있어서 상태를 스토어로 공유한다
// 화면설계서 공통 1: 드로어 안의 클릭 가능한 요소를 누르면 드로어는 닫힌다
export const useGnbDrawerStore = create<GnbDrawerState>((set) => ({
  ...initialState,
  openGnbDrawer: () => set({ isOpen: true }),
  closeGnbDrawer: () => set({ isOpen: false }),
  openGnbModal: (modal) => set({ isOpen: false, modal }),
  closeGnbModal: () => set({ modal: null }),
  clearGnbDrawer: () => set(initialState),
}));
