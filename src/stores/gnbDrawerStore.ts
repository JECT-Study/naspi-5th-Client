import { create } from 'zustand';

type GnbModal = 'logout' | 'withdraw';

interface GnbDrawerState {
  isOpen: boolean;
  /** 드로어에서 연 모달. 드로어는 스스로 닫힘 애니메이션을 한 뒤 닫힌다 (GnbDrawer) */
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
  // 모달만 연다. 드로어는 밀려 나가는 애니메이션이 끝난 뒤 closeGnbDrawer로 닫힌다
  openGnbModal: (modal) => set({ modal }),
  closeGnbModal: () => set({ modal: null }),
  clearGnbDrawer: () => set(initialState),
}));
