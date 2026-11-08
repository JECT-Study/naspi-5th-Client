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

// 회원가입 이름 입력, 이름 수정에서 같이 쓴다
// 공백은 앞뒤도 지우지 않고 그대로 막는다 ("한글만 사용할 수 있어요.")
export const validateNameForm = (data: NameFormData): ValidationResult => {
  const errors: NameFormErrors = {};
  const { name } = data;

  if (!name.trim()) errors.name = '이름을 입력해 주세요.';
  else if (!KOREAN_ONLY_REGEX.test(name)) errors.name = '한글만 사용할 수 있어요.';
  // 입력창에서 막지만, 붙여넣기 등으로 넘어온 경우를 위해 한 번 더 확인한다
  else if (name.length > NAME_MAX_LENGTH)
    errors.name = `${NAME_MAX_LENGTH}자까지 입력할 수 있어요.`;

  return { isValid: Object.keys(errors).length === 0, errors };
};
