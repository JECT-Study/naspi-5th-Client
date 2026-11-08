const numberFormat = new Intl.NumberFormat('ko-KR');

/** 천 단위 쉼표 `10,300` */
export const formatNumber = (value: number): string => numberFormat.format(value);

/** 부호를 붙인 숫자 `+200`, `-1,000`. 0이면 부호 없음 */
export const formatSignedNumber = (value: number): string => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${numberFormat.format(Math.abs(value))}`;
};

/** 등락률 절댓값 `3.0%`. 방향은 아이콘과 색으로 보여준다 */
export const formatRate = (rate: number): string => `${Math.abs(rate).toFixed(1)}%`;
