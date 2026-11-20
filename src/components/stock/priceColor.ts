// 가격 변화 색: 상승 NSBuy(빨강), 하락 NSSell(파랑), 보합 회색 (보합 색은 화면 작업 때 시안과 맞춘다)
export const getPriceColorClass = (change: number): string => {
  if (change > 0) return 'text-ns-buy';
  if (change < 0) return 'text-ns-sell';
  return 'text-grey-5';
};
