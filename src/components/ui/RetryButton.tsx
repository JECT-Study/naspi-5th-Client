import Button from './Button';
import { RetryIcon } from './icons';

interface RetryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

// '다시 시도하기' 버튼 (시안 Button/ErrorPage Retry: Refresh 18 + 글자). 조회 실패, 이미지·관련 뉴스 실패 등에서 같이 쓴다
function RetryButton({ onClick, disabled, className }: RetryButtonProps) {
  return (
    <Button variant="small" className={className} disabled={disabled} onClick={onClick}>
      <RetryIcon />
      다시 시도하기
    </Button>
  );
}

export default RetryButton;
