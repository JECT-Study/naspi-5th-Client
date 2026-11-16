interface NameFormData {
  name: string;
}

export type NameFormErrors = Partial<Record<keyof NameFormData, string>>;

interface ValidationResult {
  isValid: boolean;
  errors: NameFormErrors;
}

// 한글만: 완성형(가~힣)뿐 아니라 자음·모음만 있는 글자(ㅇㅇ, ㅏ)도 된다 (2026-11-08 기획 확인)
// 공백·영문·숫자·특수문자는 안 된다
const KOREAN_ONLY_REGEX = /^[가-힣ㄱ-ㅎㅏ-ㅣ]+$/;

/** 이름 최대 글자 수 (서비스 정책: 최대 5자의 한글). 입력창 maxLength에도 쓴다 */
export const NAME_MAX_LENGTH = 5;

/** 문자 오류메세지 (화면설계서 공통 1-2-1). 유효하지 않은 이름에 보여주는 유일한 문구다 */
export const INVALID_NAME_MESSAGE = '한글만 사용할 수 있어요.';

// 회원가입 이름 입력, 이름 수정에서 같이 쓴다
// 공백은 앞뒤도 지우지 않고 그대로 막는다
// 설계서의 이름 오류 문구는 1-2-1 하나뿐이라, 유효하지 않으면 모두 이 문구다
// (공란은 버튼이 비활성화돼서, 5자 초과는 입력칸에서 막혀서 실제로는 오지 않는다. 혹시 넘어와도 막는다)
export const validateNameForm = (data: NameFormData): ValidationResult => {
  const errors: NameFormErrors = {};
  const { name } = data;

  if (!name.trim() || !KOREAN_ONLY_REGEX.test(name) || name.length > NAME_MAX_LENGTH) {
    errors.name = INVALID_NAME_MESSAGE;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
