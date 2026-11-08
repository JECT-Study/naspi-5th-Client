import type { Stock } from './stock.types';

/**
 * 종목 정렬 (화면설계서 공통): 내 종목은 따로, 나머지는 상장 완료가 이른 순
 * 대기실, 시장, 내 자산, 참여자 최종 자산에서 같이 쓴다
 */
export const splitAndSortStocks = <T extends Pick<Stock, 'isMine' | 'listedAt'>>(
  stocks: T[],
): { myStock: T | undefined; otherStocks: T[] } => ({
  myStock: stocks.find((stock) => stock.isMine),
  otherStocks: stocks
    .filter((stock) => !stock.isMine)
    .sort((a, b) => Date.parse(a.listedAt) - Date.parse(b.listedAt)),
});
