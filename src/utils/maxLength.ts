import type {
  ChangeEvent,
  ChangeEventHandler,
  CompositionEvent,
  CompositionEventHandler,
} from 'react';
import { countGraphemes, sliceGraphemes } from './graphemes';

export type TextElement = HTMLInputElement | HTMLTextAreaElement;

// 화면설계서: 최대 글자 수를 넘으면 추가 입력이 진행되지 않는다 (이름 5자, 리그 이름 12자 등)
// 글자 수는 보이는 글자 단위로 센다 (이모지도 1자, utils/graphemes)
// 브라우저 maxLength 속성은 UTF-16 단위로 세서(이모지 2~8자) 쓰지 않고, 입력될 때마다 넘친 글자를 직접 잘라 낸다
// - 새로 넣은 글자(커서 앞)만 자르고 커서 뒤 글자는 지킨다: 꽉 찬 칸 중간에 쳐도 끝 글자가 밀려나지 않는다 (maxLength 속성과 같은 동작)
// - 한글은 입력기(IME)가 조합하는 동안에도 넘친 글자를 바로 자르고, 조합이 끝날 때 한 번 더 자른다
// (포커스를 뺐다 넣어 조합을 끝내는 방법은 iOS에서 키보드가 다시 올라오지 않을 수 있어 쓰지 않는다)

/** 최대 글자 수를 넘은 글자를 잘라 낸다. 잘랐으면 true */
const trimOverflow = (element: TextElement, maxLength: number): boolean => {
  const { value } = element;
  if (countGraphemes(value) <= maxLength) return false;
  const caret = element.selectionEnd ?? value.length;
  const tail = value.slice(caret);
  const room = maxLength - countGraphemes(tail);
  // 커서 뒤만으로도 넘치면(코드로 값을 바꾼 경우 등) 앞에서부터 최대 글자 수만 남긴다
  if (room < 0) {
    element.value = sliceGraphemes(value, maxLength);
    return true;
  }
  const head = sliceGraphemes(value.slice(0, caret), room);
  element.value = head + tail;
  element.setSelectionRange(head.length, head.length);
  return true;
};

/**
 * 최대 글자 수가 있는 입력칸에 붙이는 onChange·onCompositionEnd
 * 넘친 글자를 잘라 낸 값으로 원래 onChange를 부른다. 입력칸에 maxLength 속성은 넣지 않는다
 * @example <input {...maxLengthHandlers(5, (event) => setName(event.target.value))} />
 */
export const maxLengthHandlers = <T extends TextElement>(
  maxLength: number,
  onChange?: ChangeEventHandler<T>,
  onCompositionEnd?: CompositionEventHandler<T>,
) => ({
  onChange: (event: ChangeEvent<T>) => {
    trimOverflow(event.currentTarget, maxLength);
    onChange?.(event);
  },
  onCompositionEnd: (event: CompositionEvent<T>) => {
    onCompositionEnd?.(event);
    // 브라우저에 따라 조합이 끝난 뒤 입력 이벤트가 다시 오지 않으므로, 잘랐으면 여기서 바뀐 값을 알린다
    // 받는 쪽은 event.target.value만 읽으므로 같은 입력칸의 이벤트를 그대로 넘긴다
    if (trimOverflow(event.currentTarget, maxLength)) {
      onChange?.(event as unknown as ChangeEvent<T>);
    }
  },
});
