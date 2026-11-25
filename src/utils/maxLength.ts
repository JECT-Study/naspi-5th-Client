import type {
  ChangeEvent,
  ChangeEventHandler,
  CompositionEvent,
  CompositionEventHandler,
} from 'react';

export type TextElement = HTMLInputElement | HTMLTextAreaElement;

// 화면설계서: 최대 글자 수를 넘으면 추가 입력이 진행되지 않는다 (이름 5자, 리그 이름 12자 등)
// 한글은 입력기(IME)가 글자를 조합하는 동안 maxLength를 넘겨 들어갈 수 있다 (크롬·사파리)
// 예: 5자까지인 이름 칸에 5자를 채운 뒤 6번째 글자를 치면 그대로 들어간다
// 그래서 입력될 때마다(조합 중이어도) 넘친 글자를 바로 잘라 낸다. 조합이 끝날 때 한 번 더 자른다
// (포커스를 뺐다 넣어 조합을 끝내는 방법은 iOS에서 키보드가 다시 올라오지 않을 수 있어 쓰지 않는다)

/** maxLength를 넘은 글자를 잘라 낸다. 잘랐으면 true */
const trimOverflow = (element: TextElement): boolean => {
  const { maxLength, value } = element;
  if (maxLength < 0 || value.length <= maxLength) return false;
  element.value = value.slice(0, maxLength);
  return true;
};

/**
 * maxLength가 있는 입력칸에 붙이는 onChange·onCompositionEnd
 * 넘친 글자를 잘라 낸 값으로 원래 onChange를 부른다
 * @example <input maxLength={5} {...maxLengthHandlers((event) => setName(event.target.value))} />
 */
export const maxLengthHandlers = <T extends TextElement>(
  onChange?: ChangeEventHandler<T>,
  onCompositionEnd?: CompositionEventHandler<T>,
) => ({
  onChange: (event: ChangeEvent<T>) => {
    trimOverflow(event.currentTarget);
    onChange?.(event);
  },
  onCompositionEnd: (event: CompositionEvent<T>) => {
    onCompositionEnd?.(event);
    // 브라우저에 따라 조합이 끝난 뒤 입력 이벤트가 다시 오지 않으므로, 잘랐으면 여기서 바뀐 값을 알린다
    // 받는 쪽은 event.target.value만 읽으므로 같은 입력칸의 이벤트를 그대로 넘긴다
    if (trimOverflow(event.currentTarget)) onChange?.(event as unknown as ChangeEvent<T>);
  },
});
