import { useGnbDrawerStore } from '@/stores/gnbDrawerStore';
import { MenuIcon } from './icons';

// 상단바 오른쪽 햄버거 버튼. 드로어는 AuthLayout에 있다
function GnbMenuButton() {
  const openGnbDrawer = useGnbDrawerStore((state) => state.openGnbDrawer);

  return (
    <button type="button" aria-label="메뉴 열기" onClick={openGnbDrawer}>
      <MenuIcon className="text-grey-7" />
    </button>
  );
}

export default GnbMenuButton;
