import { cn } from '@/utils/cn';

// Button과 ButtonLink가 같은 모양을 쓰도록 클래스를 한곳에서 만든다 (디자인 시스템 Button, Button/ErrorPage)
// - primary: 파란 기본 버튼 (대기실 생성하기, 공시 쓰기, 리그 시작하기 …)
// - secondary: 흰 버튼 + 진한 글자 (내 종목 상장·수정하기, 결과의 새 리그 만들기)
// - subtle: 흰 버튼 + 연한 글자 (메인의 코드로 참여)
// - link: 배경 없는 밑줄 글자 버튼 (또는 코드로 참여하기, 또는 새 리그 만들기)
// - small: 오류 화면의 작은 회색 버튼 (메인 페이지로 이동, 다시 시도, 다시 불러오기)

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'link' | 'small';

// 큰 버튼 공통: 높이 48, 좌우 16, 모서리 6
const LARGE = 'h-12 px-4 text-button2';

// 비활성은 반투명(opacity) 대신 불투명한 색으로: 하단에 떠 있는 버튼 뒤로 내용이 비쳐 보이지 않게
// 요청 중(aria-busy)에도 버튼은 막히지만(disabled) 색은 그대로 두고 그림자만 뺀다 (시안 '대기실 생성 중')
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: cn(
    LARGE,
    'bg-ns-blue text-white shadow-modal aria-busy:shadow-none',
    'disabled:not-aria-busy:bg-grey-2 disabled:not-aria-busy:text-grey-5',
  ),
  secondary: cn(
    LARGE,
    'border border-grey-2 bg-white text-grey-8 shadow-modal disabled:text-grey-4',
  ),
  subtle: cn(LARGE, 'border border-grey-2 bg-white text-grey-5 shadow-modal disabled:text-grey-4'),
  link: cn(LARGE, 'text-grey-5 underline disabled:text-grey-4'),
  small: 'h-7.5 gap-1 px-2 py-1 bg-grey-1 text-button3 text-grey-7 disabled:text-grey-4',
};

export const getButtonClassName = (variant: ButtonVariant, className?: string) =>
  cn('flex items-center justify-center rounded-md', VARIANT_CLASS[variant], className);
