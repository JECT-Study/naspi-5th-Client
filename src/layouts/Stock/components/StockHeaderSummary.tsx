import type { StockDetail } from '@/apis/domains/stock/stock.types';
import { getPriceColorClass } from '@/components/stock/priceColor';
import { cn } from '@/utils/cn';
import { formatNumber, formatRate } from '@/utils/format';

interface StockHeaderSummaryProps {
  stock: StockDetail;
}

// 종목 상단바 최소화 상태 (시안 Header/종목/최소화): 현재가 박스가 스크롤로 가려지면 상단바 가운데에 보여준다
//   종목 이름 (Button2 Grey/8)
//   {현재가}원 ({등락률}%)  (Body3(t), 오르면 빨강·내리면 파랑)
// 줄 간격 6, 아래 여백 4. 문구는 시안대로 등락률에 괄호 (디자이너·기획 확인)
function StockHeaderSummary({ stock }: StockHeaderSummaryProps) {
  return (
    <div className="flex max-w-full flex-col items-center gap-1.5 pb-1">
      {/* 페이지 제목(h1)은 PageHeader에 이미 있어서 여기는 일반 글자로 */}
      <p className="max-w-full truncate text-button2 text-grey-8">{stock.name}</p>
      <p className={cn('text-body3-t', getPriceColorClass(stock.change))}>
        {formatNumber(stock.price)}원 ({formatRate(stock.changeRate)})
      </p>
    </div>
  );
}

export default StockHeaderSummary;
