// 한글 자판(두벌식) 상태로 친 글자를 같은 자리의 영문 키로 바꾼다. 예: 'ㅏㅏㅏㅏ' → 'kkkk', '가' → 'rk'
// 영문만 받는 칸(초대 코드)에서 한/영 전환을 깜빡해도 입력되게 할 때 쓴다

// 완성형 한글 = 초성 19 × 중성 21 × 종성 28 (유니코드 조합 순서). 공백으로 나눈 키 목록
const CHOSEONG_KEYS = 'r R s e E f a q Q t T d w W c z x v g'.split(' ');
const JUNGSEONG_KEYS = 'k o i O j p u P h hk ho hl y n nj np nl b m ml l'.split(' ');
// 첫 칸은 받침 없음
const JONGSEONG_KEYS = ' r R rt s sw sg e f fr fa fq ft fx fv fg a q qt t T d w c z x v g'.split(
  ' ',
);
// 자음·모음만 있는 글자 (ㄱ U+3131 ~ ㅣ U+3163)
const JAMO_KEYS = (
  'r R rt s sw sg e E f fr fa fq ft fx fv fg a q Q qt t T d w W c z x v g ' +
  'k o i O j p u P h hk ho hl y n nj np nl b m ml l'
).split(' ');

const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;
const JAMO_START = 0x3131;
const JAMO_END = 0x3163;

const toKeys = (char: string): string => {
  const code = char.codePointAt(0) ?? 0;
  if (code >= SYLLABLE_START && code <= SYLLABLE_END) {
    const index = code - SYLLABLE_START;
    return (
      CHOSEONG_KEYS[Math.floor(index / 588)] +
      JUNGSEONG_KEYS[Math.floor((index % 588) / 28)] +
      JONGSEONG_KEYS[index % 28]
    );
  }
  if (code >= JAMO_START && code <= JAMO_END) return JAMO_KEYS[code - JAMO_START];
  return char;
};

/** 문자열 속 한글을 두벌식 영문 키로 바꾼다. 한글이 아닌 글자는 그대로 둔다 */
export const hangulToQwerty = (value: string): string => Array.from(value, toKeys).join('');
