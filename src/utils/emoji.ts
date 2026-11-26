// 이모지 입력 막기 (화면설계서 v1.9: 이름·리그 이름·종목 이름은 이모지 입력 불가, 나머지 칸은 가능)
// 그림 문자 + 이모지를 이루는 조각(국기 글자, 피부색, 이어 붙이기·이모지 모양 표시, 키캡, 지역 깃발 태그)을 지운다
// - 그림 문자(Extended_Pictographic): 😀 ❤ ⭐ 등. ©·®·™도 여기에 들어가 같이 막힌다
// - 1️⃣처럼 숫자로 시작하는 키캡은 숫자만 남는다
const EMOJI_REGEX =
  /\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|‍|️|⃣|[\u{E0020}-\u{E007F}]/gu;

/** 글자에서 이모지를 지운다 */
export const removeEmoji = (value: string): string => value.replace(EMOJI_REGEX, '');

/** 입력칸 값에서 이모지를 지우고 커서를 지운 만큼 당긴다. 지웠으면 true */
export const stripEmoji = (input: HTMLInputElement): boolean => {
  const { value } = input;
  const cleaned = removeEmoji(value);
  if (cleaned === value) return false;
  const caret = input.selectionStart ?? value.length;
  const caretAfter = removeEmoji(value.slice(0, caret)).length;
  input.value = cleaned;
  input.setSelectionRange(caretAfter, caretAfter);
  return true;
};
