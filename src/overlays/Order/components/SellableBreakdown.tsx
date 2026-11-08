import { useState } from 'react';
import type { Holding } from '@/apis/domains/asset/asset.types';
import { formatNumber } from '@/utils/format';

interface SellableBreakdownProps {
  holding: Holding | undefined;
  /** 내 종목 최소 유지분 (서비스 정책 5.5) */
  minimumOwnHolding: number;
}

// 판매 가능한 주식 {n}주 + "왜 {n}주인가요?" 계산 내역 (보유 - 판매 주문 중 - 내 종목 최소 유지분)
function SellableBreakdown({ holding, minimumOwnHolding }: SellableBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sellable = holding?.sellableQuantity ?? 0;

  return (
    <div className="text-xs">
      <div className="flex items-center justify-between">
        <span className="text-gray-500">
          판매 가능한 주식{' '}
          <span className="font-bold text-gray-900">{formatNumber(sellable)}주</span>
        </span>
        <button
          type="button"
          className="text-gray-500 underline"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          왜 {formatNumber(sellable)}주인가요?
        </button>
      </div>
      {isOpen && (
        <dl className="mt-2 flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3">
          <div className="flex justify-between">
            <dt>보유</dt>
            <dd>{formatNumber(holding?.quantity ?? 0)}주</dd>
          </div>
          <div className="flex justify-between">
            <dt>판매 주문 중</dt>
            <dd>- {formatNumber(holding?.sellingQuantity ?? 0)}주</dd>
          </div>
          {holding?.isMine && (
            <div className="flex justify-between">
              <dt>내 종목 최소 유지분</dt>
              <dd>- {formatNumber(minimumOwnHolding)}주</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-bold">
            <dt>판매 가능</dt>
            <dd>{formatNumber(sellable)}주</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export default SellableBreakdown;
