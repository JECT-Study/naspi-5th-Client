// 가격 변화 색: 상승 NSBuy(빨강), 하락 NSSell(파랑), 보합 Grey/6 (시안 시장·상장 미리보기 "0.0%")
export const getPriceColorClass = (change: number): string => {
  if (change > 0) return 'text-ns-buy';
  if (change < 0) return 'text-ns-sell';
  return 'text-grey-6';
};
