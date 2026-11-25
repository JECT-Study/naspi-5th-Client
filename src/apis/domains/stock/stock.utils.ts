import type { Stock } from './stock.types';

/**
 * 종목 나누기 (화면설계서 공통 정렬): 내 종목은 따로, 나머지는 상장 완료가 이른 순
 * 서버가 상장 순으로 주므로 받은 순서를 그대로 두고 내 종목만 꺼낸다
 * 시장, 내 자산, 참여자 최종 자산에서 같이 쓴다
 */
export const splitMyStock = <T extends Pick<Stock, 'isMine'>>(
  stocks: T[],
): { myStock: T | undefined; otherStocks: T[] } => ({
  myStock: stocks.find((stock) => stock.isMine),
  otherStocks: stocks.filter((stock) => !stock.isMine),
});
