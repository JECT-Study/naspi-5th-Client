import type { ClipboardEvent } from 'react';

// 입력칸 맨 앞 공백 막기 (이름·리그 이름·종목 이름)
// - 직접 칠 때: 맨 앞에 들어온 공백을 바로 지운다. 중간 공백("우리 리그")은 그대로 둔다
// - 붙여넣기: 앞 공백을 먼저 걷어 낸 뒤 최대 글자 수만큼 채운다
//   브라우저에 맡기면 maxLength가 앞 공백까지 세어 먼저 자르고 그다음 공백이 지워져서 뒤 글자가 빠진다
//   ('    가나다라마바사아자차카타' → '가나다라마바사아')
// 한글 조합 중에는 값을 건드리지 않는다 (조합 중인 글자를 바꾸면 글자가 겹친다). 앞 공백은 조합으로 생기지 않는다

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

// React가 관리하는 입력칸 값을 코드로 바꾸고 onChange까지 불리게 한다
// (value를 그냥 바꾸면 React가 바뀐 줄 몰라 onChange가 오지 않는다)
const setValueAndNotify = (input: HTMLInputElement, value: string) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

/**
 * 붙여넣기: 붙인 결과가 공백으로 시작하면 브라우저 대신 직접 넣는다
 * (커서 앞 + 붙여 넣은 글자) 앞 공백 걷기 → 남는 자리(maxLength - 커서 뒤 글자)만큼 채우기. 커서는 붙여 넣은 글자 뒤
 * 공백으로 시작하지 않으면 브라우저 기본 동작 그대로 둔다
 */
export const pasteWithoutLeadingSpace = (event: ClipboardEvent<HTMLInputElement>) => {
  const input = event.currentTarget;
  // 한 줄 입력칸이라 줄바꿈은 브라우저처럼 뺀다
  const pasted = event.clipboardData.getData('text').replace(/[\r\n]+/g, '');
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  const head = input.value.slice(0, start) + pasted;
  if (head.trimStart() === head) return;

  event.preventDefault();
  const trimmedHead = head.trimStart();
  // 앞이 모두 공백이었으면 커서 뒤 글자가 맨 앞이 되므로 그 앞 공백도 걷는다
  const tail = trimmedHead === '' ? input.value.slice(end).trimStart() : input.value.slice(end);
  const room = input.maxLength >= 0 ? Math.max(0, input.maxLength - tail.length) : Infinity;
  const fitted = trimmedHead.slice(0, room);
  setValueAndNotify(input, fitted + tail);
  input.setSelectionRange(fitted.length, fitted.length);
};
