import { formatNumber } from '@/utils/format';

/** 오류 문구를 1초 보여준 뒤 값을 고친다 (화면설계서 주문 5-1, 5-2, 7, 8) */
export const ORDER_CORRECTION_DELAY_MS = 1_000;

export const ORDER_MESSAGES = {
  /** 주문 3-1 */
  quantityEmpty: '수량을 입력해 주세요.',
  /** 주문 7 */
  cashShortage: '사용 가능한 현금이 부족해요.',
  /** 주문 8 */
  sharesShortage: '판매 가능한 주식이 부족해요.',
  /** 주문 5-1 */
  aboveUpperLimit: (upperLimit: number) =>
    `상한가 ${formatNumber(upperLimit)}원 이하로만 지정할 수 있어요.`,
  /** 주문 5-2 */
  belowLowerLimit: (lowerLimit: number) =>
    `하한가 ${formatNumber(lowerLimit)}원 이상으로만 지정할 수 있어요.`,
};

/** 지정가가 상한가·하한가 범위를 벗어났을 때의 문구. 범위 안이면 undefined */
export const getPriceLimitError = (
  price: number,
  { upperLimit, lowerLimit }: { upperLimit: number; lowerLimit: number },
): string | undefined => {
  if (price > upperLimit) return ORDER_MESSAGES.aboveUpperLimit(upperLimit);
  if (price < lowerLimit) return ORDER_MESSAGES.belowLowerLimit(lowerLimit);
  return undefined;
};

/** 주문 버튼 활성화 조건 (주문 9): 시장가는 수량, 지정가는 가격과 수량이 모두 있을 때 */
export const isOrderFilled = (isLimit: boolean, price: number, quantity: number): boolean =>
  quantity > 0 && (!isLimit || price > 0);
