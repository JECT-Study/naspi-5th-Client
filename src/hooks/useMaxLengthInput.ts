import {
  useEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type CompositionEventHandler,
} from 'react';
import { maxLengthHandlers, type TextElement } from '@/utils/maxLength';

/**
 * 최대 글자 수가 있는 입력칸 (디자이너 규칙, 종목 소개·공시 제목·본문·댓글·이름 등 공통)
 * - 넘친 글자는 잘라 낸다 (utils/maxLength)
 * - 최대를 넘겨 입력하려 하면 isOverLimit이 true → 글자 수 "(최대/최대)"와 입력칸을 붉게
 * - 고칠 때까지 유지: 글자가 최대보다 적어지면 풀린다
 *
 * 최대에 닿은 칸은 브라우저(maxLength)가 입력을 막아 onChange가 오지 않으므로,
 * 입력 직전 이벤트(beforeinput)에서 "이번 입력으로 최대를 넘는지"를 본다
 * 한글 조합 중 넘친 경우는 잘라 낼 때 알 수 있다 (onOverflow)
 */
export const useMaxLengthInput = <T extends TextElement>({
  maxLength,
  onChange,
  onCompositionEnd,
}: {
  maxLength?: number;
  onChange?: ChangeEventHandler<T>;
  onCompositionEnd?: CompositionEventHandler<T>;
}) => {
  const ref = useRef<T>(null);
  const [isOverLimit, setIsOverLimit] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || maxLength === undefined) return;
    // input·textarea를 함께 받는 타입이라 이벤트 타입을 좁히지 못해 InputEvent로 바꿔 쓴다
    const handleBeforeInput = (rawEvent: Event) => {
      const event = rawEvent as InputEvent;
      // 조합 중인 글자는 잘라 낼 때 처리한다
      if (event.isComposing || !event.inputType.startsWith('insert')) return;
      const selected = (element.selectionEnd ?? 0) - (element.selectionStart ?? 0);
      const added = event.data?.length ?? event.dataTransfer?.getData('text/plain').length ?? 1;
      if (element.value.length - selected + added > maxLength) setIsOverLimit(true);
    };
    element.addEventListener('beforeinput', handleBeforeInput);
    return () => element.removeEventListener('beforeinput', handleBeforeInput);
  }, [maxLength]);

  const handlers = maxLengthHandlers<T>(
    (event) => {
      if (maxLength !== undefined && event.currentTarget.value.length < maxLength) {
        setIsOverLimit(false);
      }
      onChange?.(event);
    },
    onCompositionEnd,
    () => setIsOverLimit(true),
  );

  return { ref, isOverLimit, handlers };
};
