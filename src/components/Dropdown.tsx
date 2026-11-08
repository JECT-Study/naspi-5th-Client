import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface DropdownItem {
  label: string;
  onSelect: () => void;
}

interface DropdownProps {
  /** 아이콘 버튼의 접근성 이름 */
  label: string;
  icon: ReactNode;
  items: DropdownItem[];
  className?: string;
}

// 아이콘 버튼 + 아래로 펼쳐지는 메뉴 (메인 + 버튼, 대기실 점 3개 메뉴)
// 화면설계서 공통: 옵션을 고르거나 바깥 영역을 누르면 닫힌다
function Dropdown({ label, icon, items, className }: DropdownProps) {
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
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {icon}
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-2 flex w-36 flex-col divide-y rounded-lg border bg-white text-sm shadow-md"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="px-4 py-3 text-left"
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
