import type { ReactNode } from 'react';
import { useGoBack } from '@/hooks/useGoBack';
import { cn } from '@/utils/cn';
import GnbMenuButton from './GnbMenuButton';
import { HEADER_CLASS, HEADER_ICON_BUTTON_CLASS, HEADER_TITLE_CLASS } from './headerStyles';
import { ChevronLeftIcon } from './icons';

interface PageHeaderProps {
  title: string;
  /** 앱 안에 이전 화면이 없을 때(주소로 바로 들어온 경우) 돌아갈 상위 화면 */
  fallbackTo?: string;
  /**
   * 헤더 정가운데에 보여줄 내용. showCenter가 true면 제목 대신 이것을 보여준다
   * (종목 화면: 현재가 박스가 스크롤로 가려지면 종목명 + 가격·등락률)
   */
  center?: ReactNode;
  showCenter?: boolean;
}

// Depth 3 상단바 (화면설계서 공통 4-3, 시안 Header Depth3): 뒤로 가기 + 페이지명 + 메뉴
// 오른쪽 여백 8. 뒤로 가기(44 영역) 바로 옆에 페이지명
// 공시 상세, 뉴스 상세, 종목, 주문 내역에서 쓴다
// 탭 이동은 replace로 해서 기록이 쌓이지 않으므로, 뒤로 가기는 이 화면에 들어오기 전 화면으로 간다
function PageHeader({ title, fallbackTo, center, showCenter = false }: PageHeaderProps) {
  const goBack = useGoBack(fallbackTo);

  return (
    <header className={cn(HEADER_CLASS, 'pr-2')}>
      <button
        type="button"
        aria-label="뒤로 가기"
        className={HEADER_ICON_BUTTON_CLASS}
        onClick={goBack}
      >
        <ChevronLeftIcon className="text-grey-6" />
      </button>
      {/* 제목과 가운데 내용은 둘 다 그려 두고, 0.2초 동안 겹치며 바뀐다 (스크롤 중에 툭툭 끊기지 않게) */}
      <h1
        aria-hidden={showCenter || undefined}
        className={cn(
          HEADER_TITLE_CLASS,
          'min-w-0 flex-1 transition-opacity duration-200',
          showCenter && 'opacity-0',
        )}
      >
        {title}
      </h1>
      {center && (
        // 시안 Header/종목/최소화: 뒤로 가기(44)와 메뉴(44 + 오른쪽 여백 8) 사이 가운데
        <div
          aria-hidden={!showCenter || undefined}
          className={cn(
            'pointer-events-none absolute right-13 left-11 flex flex-col items-center transition duration-200',
            showCenter ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
          )}
        >
          {center}
        </div>
      )}
      <GnbMenuButton />
    </header>
  );
}

export default PageHeader;
