import { hangulToQwerty } from '@/utils/hangulKeyboard';

/**
 * 리그 이름 최대 글자 수 (모든 문자). 새 리그(1-1)와 대기실 리그 이름 수정(1-2)에 같이 쓴다
 * 설계서 v.1.3·서비스 정책은 20자였지만 12자로 바뀜 (2026-11-08 기획 변경)
 */
export const ROOM_NAME_MAX_LENGTH = 12;

/**
 * 초대 코드 자릿수. 영문 대문자·숫자를 섞은 랜덤 7자 (설계서 v.1.5 대기실 2)
 * v.1.4까지는 앞 4자리 영문 + 뒤 3자리 숫자였다
 */
export const INVITE_CODE_LENGTH = 7;
const INVITE_CODE_CHAR_REGEX = /^[A-Z0-9]$/;

/**
 * 입력값을 초대 코드 형식으로 맞춘다. 대문자로 바꾸고, 영문·숫자가 아닌 글자는 버린다
 * 한글 자판 상태로 쳤으면 같은 자리의 영문으로 바꾼다 (한/영 전환을 깜빡해도 입력되게)
 * 예: 'k7-q 2a9x' → 'K7Q2A9X', 'ㅏ7ㅂ2' → 'K7Q2'
 */
export const normalizeInviteCode = (value: string): string =>
  Array.from(hangulToQwerty(value).toUpperCase())
    .filter((char) => INVITE_CODE_CHAR_REGEX.test(char))
    .slice(0, INVITE_CODE_LENGTH)
    .join('');

export const isInviteCodeComplete = (code: string): boolean => code.length === INVITE_CODE_LENGTH;
