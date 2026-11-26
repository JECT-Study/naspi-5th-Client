// 글자 수는 눈에 보이는 글자 단위로 센다 (이모지도 1자): 😀, 👍🏻, 🇰🇷, 👨‍👩‍👧 모두 1자
// JS 문자열 길이(value.length)는 UTF-16 단위라 이모지가 2~8자로 세진다
// 서버도 같은 기준(보이는 글자 단위)으로 센다 (백엔드와 맞춤, 2026-11-26)
const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });

/** 보이는 글자 수 */
export const countGraphemes = (text: string): number => Array.from(segmenter.segment(text)).length;

/** 앞에서부터 보이는 글자 count개만 남긴다 */
export const sliceGraphemes = (text: string, count: number): string => {
  if (count <= 0) return '';
  let kept = 0;
  for (const { index } of segmenter.segment(text)) {
    if (kept === count) return text.slice(0, index);
    kept += 1;
  }
  return text;
};
