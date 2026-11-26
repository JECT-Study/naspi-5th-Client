// 입력칸 공백 막기 (설계서 v1.9: 이름은 공백을 아예 못 쓰고, 리그 이름·종목 이름은 앞 공백만 지운다)
// - 맨 앞에 들어온 공백을 바로 지운다. 중간 공백("우리 리그")은 그대로 둔다 (이름은 중간 공백도 지운다)
// - 붙여넣기도 같다: 브라우저가 붙인 뒤 앞 공백을 지우고, 그다음 최대 글자 수만큼 자른다 (TextField에서 순서를 지킨다)
//   ('    가나다라마바사아자차카타' → '가나다라마바사아자차카타', 앞 공백을 세어 먼저 자르면 뒤 글자가 빠진다)
// 한글 조합 중에는 값을 건드리지 않는다 (조합 중인 글자를 바꾸면 글자가 겹친다). 앞 공백은 조합으로 생기지 않는다

/** 입력칸 값의 공백을 모두 지우고 커서를 그만큼 당긴다. 지웠으면 true (설계서 v1.9: 이름은 공백 사용 불가) */
export const stripAllSpaces = (input: HTMLInputElement): boolean => {
  const { value } = input;
  const cleaned = value.replace(/\s+/g, '');
  if (cleaned === value) return false;
  const caret = input.selectionStart ?? value.length;
  const caretAfter = value.slice(0, caret).replace(/\s+/g, '').length;
  input.value = cleaned;
  input.setSelectionRange(caretAfter, caretAfter);
  return true;
};

/** 입력칸 값의 맨 앞 공백을 지우고 커서를 그만큼 당긴다. 지웠으면 true */
export const stripLeadingSpace = (input: HTMLInputElement): boolean => {
  const { value } = input;
  const removed = value.length - value.trimStart().length;
  if (removed === 0) return false;
  const caret = Math.max(0, (input.selectionStart ?? value.length) - removed);
  input.value = value.slice(removed);
  input.setSelectionRange(caret, caret);
  return true;
};
