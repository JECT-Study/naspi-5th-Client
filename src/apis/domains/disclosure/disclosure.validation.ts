/** 공시 제목 최대 글자 수 (서비스 정책 3.1: 1~30자) */
export const DISCLOSURE_TITLE_MAX_LENGTH = 30;
/** 공시 본문 최대 글자 수 (서비스 정책 3.1: 1~300자) */
export const DISCLOSURE_CONTENT_MAX_LENGTH = 300;
/** 글자 수를 보여주기 시작하는 글자 수 (화면설계서 공시 쓰기 3-1) */
export const DISCLOSURE_TITLE_COUNTER_FROM = 20;
export const DISCLOSURE_CONTENT_COUNTER_FROM = 290;
/** 첨부 이미지 최대 개수 (서비스 정책 3.1) */
export const DISCLOSURE_MAX_IMAGES = 4;
/** 첨부할 수 있는 이미지 형식: JPEG(.jpg/.jpeg), PNG (서비스 정책 3.1) */
export const DISCLOSURE_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export const isDisclosureImage = (file: File): boolean =>
  DISCLOSURE_IMAGE_TYPES.includes(file.type);

/** 제목·본문을 모두 입력했는지 (게시 버튼 활성화 조건) */
export const isDisclosureFilled = (title: string, content: string): boolean =>
  title.trim() !== '' && content.trim() !== '';
