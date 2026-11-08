import type { CSSProperties } from 'react';
import { cn } from '@/utils/cn';

interface TradingViewAttributionProps {
  className?: string;
}

// 차트 라이브러리(TradingView Lightweight Charts) 라이선스 표시: tradingview.com 링크가 걸린 로고
// 라이브러리의 기본 로고(attributionLogo)는 차트 안 왼쪽 아래에 고정이라 거래량을 가려서, 끄고 차트 아래에 직접 둔다
// 로고 그림은 라이브러리가 그리는 것과 같다. 저작권 문구(NOTICE)는 약관 페이지에 (GnbDrawer TERMS_LINKS 참고)
function TradingViewAttribution({ className }: TradingViewAttributionProps) {
  return (
    <a
      href="https://www.tradingview.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="TradingView 차트 라이브러리"
      title="Charting by TradingView"
      className={cn('inline-flex self-start', className)}
      style={{ '--fill': '#131722', '--stroke': '#fff' } as CSSProperties}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="35" height="19" fill="none" aria-hidden="true">
        <g fillRule="evenodd" clipRule="evenodd">
          <path
            fill="var(--stroke)"
            d="M2 0H0v10h6v9h21.4l.5-1.3 6-15 1-2.7H23.7l-.5 1.3-.2.6a5 5 0 0 0-7-.9V0H2Zm20 17h4l5.2-13 .8-2h-7l-1 2.5-.2.5-1.5 3.8-.3.7V17Zm-.8-10a3 3 0 0 0 .7-2.7A3 3 0 1 0 16.8 7h4.4ZM14 7V2H2v6h6v9h4V7h2Z"
          />
          <path
            fill="var(--fill)"
            d="M14 2H2v6h6v9h6V2Zm12 15h-7l6-15h7l-6 15Zm-7-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          />
        </g>
      </svg>
    </a>
  );
}

export default TradingViewAttribution;
