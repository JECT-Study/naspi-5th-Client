import type { ReactNode } from 'react';
import { useGoBack } from '@/hooks/useGoBack';
import { cn } from '@/utils/cn';
import GnbMenuButton from './GnbMenuButton';
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

// Depth 3 상단바 (화면설계서 공통 4-3): 뒤로 가기 + 페이지 제목 + 메뉴
// 공시 상세, 뉴스 상세, 종목, 주문 내역에서 쓴다
// 탭 이동은 replace로 해서 기록이 쌓이지 않으므로, 뒤로 가기는 이 화면에 들어오기 전 화면으로 간다
function PageHeader({ title, fallbackTo, center, showCenter = false }: PageHeaderProps) {
  const goBack = useGoBack(fallbackTo);

  return (
    <header className="relative flex h-20 shrink-0 items-center gap-2 px-7">
      <button type="button" aria-label="뒤로 가기" onClick={goBack}>
        <ChevronLeftIcon />
      </button>
      {/* 제목과 가운데 내용은 둘 다 그려 두고, 0.2초 동안 겹치며 바뀐다 (스크롤 중에 툭툭 끊기지 않게) */}
      <h1
        aria-hidden={showCenter || undefined}
        className={cn(
          'truncate text-lg font-bold transition-opacity duration-200',
          showCenter && 'opacity-0',
        )}
      >
        {title}
      </h1>
      {center && (
        // 좌우 버튼과 겹치지 않게 가운데 폭을 제한한다
        <div
          aria-hidden={!showCenter || undefined}
          className={cn(
            'pointer-events-none absolute inset-x-20 flex flex-col items-center transition duration-200',
            showCenter ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
          )}
        >
          {center}
        </div>
      )}
      <div className="ml-auto flex">
        <GnbMenuButton />
      </div>
    </header>
  );
}

export default PageHeader;
