import { hangulToQwerty } from '@/utils/hangulKeyboard';

/**
 * 리그 이름 최대 글자 수 (모든 문자). 새 리그(1-1)와 대기실 리그 이름 수정(1-2)에 같이 쓴다
 * 설계서 v.1.3·서비스 정책은 20자였지만 12자로 바뀜 (2026-11-08 기획 변경)
 */
export const ROOM_NAME_MAX_LENGTH = 12;

/** 초대 코드 자릿수 (서비스 정책 2.1: 앞 4자리 영문 + 뒤 3자리 숫자) */
export const INVITE_CODE_LENGTH = 7;
const INVITE_CODE_LETTER_COUNT = 4;
const LETTER_REGEX = /^[A-Z]$/;
const DIGIT_REGEX = /^\d$/;

/**
 * 입력값을 초대 코드 형식으로 맞춘다. 대문자로 바꾸고, 자리에 맞지 않는 글자는 버린다
 * 한글 자판 상태로 쳤으면 같은 자리의 영문으로 바꾼다 (한/영 전환을 깜빡해도 입력되게)
 * 예: 'kk-k k12a3' → 'KKKK123', 'ㅏㅏㅏㅏ123' → 'KKKK123'
 */
export const normalizeInviteCode = (value: string): string =>
  Array.from(hangulToQwerty(value).toUpperCase()).reduce((code, char) => {
    if (code.length >= INVITE_CODE_LENGTH) return code;
    const pattern = code.length < INVITE_CODE_LETTER_COUNT ? LETTER_REGEX : DIGIT_REGEX;
    return pattern.test(char) ? code + char : code;
  }, '');

export const isInviteCodeComplete = (code: string): boolean => code.length === INVITE_CODE_LENGTH;
