import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { getButtonClassName, type ButtonVariant } from './buttonStyles';

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
}

// 버튼 모양의 페이지 이동 링크
function ButtonLink({ variant = 'primary', className, ...props }: ButtonLinkProps) {
  return <Link className={getButtonClassName(variant, className)} {...props} />;
}

export default ButtonLink;
