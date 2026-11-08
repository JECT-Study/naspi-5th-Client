// 가격 변화 색: 상승 빨강, 하락 파랑, 보합 회색. 디자인이 나오면 여기만 바꾼다
export const getPriceColorClass = (change: number): string => {
  if (change > 0) return 'text-red-500';
  if (change < 0) return 'text-blue-500';
  return 'text-gray-500';
};
