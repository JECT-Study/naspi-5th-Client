interface StockFormData {
  name: string;
  description: string;
}

export type StockFormErrors = Partial<Record<keyof StockFormData, string>>;

interface ValidationResult {
  isValid: boolean;
  errors: StockFormErrors;
}

/** 종목 이름 최대 글자 수 (서비스 정책 4.1: 최대 12자, 앞 공백은 빼고 셈) */
export const STOCK_NAME_MAX_LENGTH = 12;
/** 종목 소개 최대 글자 수 (서비스 정책 4.1: 최대 50자) */
export const STOCK_DESCRIPTION_MAX_LENGTH = 50;
/** 종목 소개 글자 수를 보여주기 시작하는 글자 수 (화면설계서 새 리그 3-3-1, 종목 정보 1-1) */
export const STOCK_DESCRIPTION_COUNTER_FROM = 40;

// 글자·숫자 없이 특수문자(공백 포함)로만 이루어졌는지
const SPECIAL_CHAR_ONLY_REGEX = /^[^\p{L}\p{N}]+$/u;

/** 입력 중인 종목 이름: 앞 공백을 지우고 최대 글자 수까지만 남긴다 */
export const normalizeStockName = (value: string): string =>
  Array.from(value.trimStart()).slice(0, STOCK_NAME_MAX_LENGTH).join('');

/** 둘 다 입력했는지 (상장 버튼 활성화 조건) */
export const isStockFormFilled = (data: StockFormData): boolean =>
  data.name.trim() !== '' && data.description.trim() !== '';

// 새 리그(방장 상장), 종목 상장·수정에서 같이 쓴다. 이름 중복은 서버가 확인한다
export const validateStockForm = (data: StockFormData): ValidationResult => {
  const errors: StockFormErrors = {};
  const name = data.name.trim();

  if (!name) errors.name = '종목 이름을 입력해 주세요.';
  else if (SPECIAL_CHAR_ONLY_REGEX.test(name)) errors.name = '특수문자만으로는 사용할 수 없어요.';

  if (!data.description.trim()) errors.description = '종목 소개를 입력해 주세요.';

  return { isValid: Object.keys(errors).length === 0, errors };
};
