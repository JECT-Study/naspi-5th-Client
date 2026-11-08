import type { StockDetail } from '@/apis/domains/stock/stock.types';
import ChangeRate from '@/components/ChangeRate';
import { getPriceColorClass } from '@/components/priceColor';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';

interface StockHeaderSummaryProps {
  stock: StockDetail;
}

// 현재가 박스가 스크롤로 가려졌을 때 헤더 가운데에 보여주는 요약 (토스증권처럼)
//   종목명
//   현재가  ▲ 등락률
function StockHeaderSummary({ stock }: StockHeaderSummaryProps) {
  return (
    <>
      {/* 페이지 제목(h1)은 PageHeader에 이미 있어서 여기는 일반 글자로 */}
      <p className="max-w-full truncate text-base font-bold">{stock.name}</p>
      <p className="flex items-center gap-1.5 text-xs">
        {/* 가격도 등락에 따라: 오르면 빨강, 내리면 파랑, 그대로면 기본 글자색 */}
        <span className={cn('font-bold', stock.change !== 0 && getPriceColorClass(stock.change))}>
          {formatNumber(stock.price)}원
        </span>
        <ChangeRate change={stock.change} changeRate={stock.changeRate} />
      </p>
    </>
  );
}

export default StockHeaderSummary;
