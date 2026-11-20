import type { ReactNode } from 'react';
import ButtonLink from '@/components/ui/ButtonLink';
import ErrorIllustration from '@/components/ui/ErrorIllustration';
import { cn } from '@/utils/cn';

interface ErrorPageProps {
  /**
   * '메인 페이지로 이동'을 누를 때 함께 할 일
   * 메인이 같은 레이아웃 안이면 레이아웃이 다시 그려지지 않아 실패한 조회를 다시 하지 않으므로, 여기서 다시 조회한다
   */
  onMoveToMain?: () => void;
}

// [공통 오류] 페이지 (화면설계서 공통 7, 시안 공통 오류 페이지)
// 잘못된 주소, 서버 오류, 화면을 그리다 난 오류 등으로 페이지 전체를 보여줄 수 없을 때. 화면별 오류 안내가 있으면 그쪽을 쓴다
function ErrorPage({ onMoveToMain }: ErrorPageProps) {
  return (
    <ErrorPageLayout
      as="main"
      title="앗, 페이지를 불러올 수 없어요."
      description="잠시 후 다시 시도하거나, 메인 페이지로 이동해 주세요."
      action={
        <ButtonLink to="/leagues" replace variant="small" onClick={onMoveToMain}>
          메인 페이지로 이동
        </ButtonLink>
      }
    />
  );
}

interface ErrorPageLayoutProps {
  title: string;
  description: ReactNode;
  action: ReactNode;
  as?: 'main' | 'div';
  className?: string;
}

// 페이지 전체 오류 틀 (시안 공통 오류 페이지·네트워크 오류 페이지가 같은 틀)
// 세로 가운데(아래 여백 64): 마스코트(위아래 20) → 16 → 제목 Heading3 + 8 + 설명 Body1.5 (모두 Grey/7) → 16 → 버튼
export function ErrorPageLayout({
  title,
  description,
  action,
  as: Tag = 'div',
  className,
}: ErrorPageLayoutProps) {
  return (
    <Tag
      className={cn(
        'flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center',
        className,
      )}
    >
      <div className="py-5">
        <ErrorIllustration />
      </div>
      <div className="flex flex-col gap-2 text-grey-7">
        <h1 className="text-heading3">{title}</h1>
        <p className="text-body1-5">{description}</p>
      </div>
      {action}
    </Tag>
  );
}

export default ErrorPage;
