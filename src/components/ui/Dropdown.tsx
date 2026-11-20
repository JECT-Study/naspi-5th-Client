import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface DropdownItem {
  label: string;
  onSelect: () => void;
  /** primary: 강조 항목 (메인 + 메뉴의 '새 리그 만들기', NSBlue) */
  tone?: 'primary';
}

interface DropdownProps {
  /** 아이콘 버튼의 접근성 이름 */
  label: string;
  icon: ReactNode;
  items: DropdownItem[];
  className?: string;
  /** 아이콘 버튼 자체의 클래스 (상단바에서는 44×44 누르는 영역) */
  buttonClassName?: string;
}

// 아이콘 버튼 + 아래로 펼쳐지는 메뉴 (메인 + 버튼, 대기실·공시·댓글 점 3개 메뉴)
// 화면설계서 공통: 옵션을 고르거나 바깥 영역을 누르면 닫힌다
// 시안 ContextMenu: 폭 160, 항목 높이 40·좌우 여백 16, Button2 Grey/6 왼쪽 정렬, 모서리 6, ModalShadow
// - 바깥 테두리·항목 사이 선 모두 Grey/1 (시안 컴포넌트마다 달랐는데 디자이너와 Grey/1로 통일하기로 함)
// - 메뉴 위치: 버튼 아래 8, 오른쪽 끝 맞춤 (시안에 없어 정한 값, 디자이너 확인)
function Dropdown({ label, icon, items, className, buttonClassName }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (item: DropdownItem) => {
    setIsOpen(false);
    item.onSelect();
  };

  return (
    <div ref={rootRef} className={cn('relative flex', className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={buttonClassName}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {icon}
      </button>
      {isOpen && (
        <div
          role="menu"
          // 바깥 테두리는 시안처럼 안쪽 선으로 그려 높이에 더하지 않는다 (항목 2개 = 80)
          // ring은 그림자(box-shadow)와 같은 속성이라 shadow-modal과 겹쳐 보여서, 안쪽으로 들인 outline으로 그린다
          className="absolute top-full right-0 z-30 mt-2 flex w-40 flex-col divide-y divide-grey-1 overflow-hidden rounded-md bg-white shadow-modal outline -outline-offset-1 outline-grey-1"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={cn(
                'h-10 px-4 text-left text-button2',
                item.tone === 'primary' ? 'text-ns-blue' : 'text-grey-6',
              )}
              onClick={() => handleSelect(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
