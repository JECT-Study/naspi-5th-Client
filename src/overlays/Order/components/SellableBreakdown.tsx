import { useEffect, useRef, useState } from 'react';
import type { Holding } from '@/apis/domains/asset/asset.types';
import { formatNumber } from '@/utils/format';

interface SellableBreakdownProps {
  holding: Holding | undefined;
  /** 내 종목 최소 유지분 (서비스 정책 5.5) */
  minimumOwnHolding: number;
}

// 판매 가능한 주식 {n}주 + "왜 {n}주인가요?" 계산 내역 (보유 - 판매 주문 중 - 내 종목 최소 유지분)
// 설계서는 아코디언이지만, 키패드가 아래에 붙어 있어 시안대로 툴팁으로 띄운다 (디자이너 코멘트)
// - 줄: "판매 가능한 주식" Body3 Grey/5 + 8 + "{n}주" Body3 Grey/8 / 오른쪽 "왜 {n}주인가요?" Body3 Grey/5 밑줄
// - 툴팁: 흰색, 모서리 6, ModalShadow, 폭 300, 여백 12·20, 줄 사이 4
//   이름 Body3 Grey/6(마지막 "판매 가능"만 NSBuy), 값 Title4 Grey/8 오른쪽 정렬
// 다시 누르거나 툴팁 밖을 누르면 닫힌다
function SellableBreakdown({ holding, minimumOwnHolding }: SellableBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sellable = holding?.sellableQuantity ?? 0;

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const rows = [
    { label: '보유', value: `${formatNumber(holding?.quantity ?? 0)}주` },
    { label: '판매 주문 중', value: `- ${formatNumber(holding?.sellingQuantity ?? 0)}주` },
    // '내 종목 최소 유지분'은 내 종목일 때만 (주문 4-1)
    ...(holding?.isMine
      ? [{ label: '내 종목 최소 유지분', value: `- ${formatNumber(minimumOwnHolding)}주` }]
      : []),
  ];

  return (
    <div ref={rootRef} className="relative flex items-center justify-between gap-2 text-body3">
      <p className="flex gap-2">
        <span className="text-grey-5">판매 가능한 주식</span>
        <span className="text-grey-8">{formatNumber(sellable)}주</span>
      </p>
      <button
        type="button"
        className="shrink-0 text-grey-5 underline"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        왜 {formatNumber(sellable)}주인가요?
      </button>
      {isOpen && (
        <dl
          role="tooltip"
          className="absolute top-full right-0 z-30 mt-2 flex w-75 max-w-full flex-col gap-1 rounded-md bg-white px-5 py-3 shadow-modal"
        >
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <dt className="text-body3 text-grey-6">{row.label}</dt>
              <dd className="text-title4 text-grey-8">{row.value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2">
            <dt className="text-body3 text-ns-buy">판매 가능</dt>
            <dd className="text-title4 text-grey-8">{formatNumber(sellable)}주</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export default SellableBreakdown;
