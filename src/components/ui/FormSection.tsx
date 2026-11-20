import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface FormSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

// 작업형 화면의 입력 섹션 (시안 새 리그·코드로 참여·종목 상장의 '... 섹션')
// - 여백 위 20·좌우 24·아래 16, 안내와 내용 사이 16
// - 안내: 제목 Title3 Grey/8, 4 띄우고 설명 Body2.5 Grey/6
function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn('flex flex-col gap-4 px-6 pt-5 pb-4', className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-title3 text-grey-8">{title}</h2>
        <p className="text-body2-5 text-grey-6">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default FormSection;
