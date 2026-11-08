import type { Ranking } from './league.types';

/** 최종 순위 정렬 (리그 결과 3): 순위가 높은 순, 공동 순위면 상장 일시가 이른 사람 먼저 */
export const sortRankings = (rankings: Ranking[]): Ranking[] =>
  [...rankings].sort((a, b) => a.rank - b.rank || Date.parse(a.listedAt) - Date.parse(b.listedAt));
