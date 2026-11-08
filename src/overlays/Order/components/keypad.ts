export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '00' | 'delete';

export const KEYPAD_KEYS: KeypadKey[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '00',
  '0',
  'delete',
];

/** 지금 값에 키를 누른 결과. 최대 자릿수를 넘으면 그대로 둔다 */
export const applyKeypadKey = (value: number, key: KeypadKey, maxDigits = 9): number => {
  const digits = value > 0 ? String(value) : '';
  const next = key === 'delete' ? digits.slice(0, -1) : `${digits}${key}`;
  if (next.length > maxDigits) return value;
  return Number(next || '0');
};
