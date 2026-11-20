import type { Ref } from 'react';
import type { StockDetail } from '@/apis/domains/stock/stock.types';
import { getPriceColorClass } from '@/components/stock/priceColor';
import { formatNumber, formatRate, formatSignedNumber } from '@/utils/format';

interface StockSummaryProps {
  stock: StockDetail;
  /** 리그 일차. 1일차는 기준가가 공모가라서 문구가 다르다 */
  day: number | undefined;
  /** 등락 줄("어제보다 …"). 이 줄이 스크롤로 다 가려지면 상단바가 축소 상태로 바뀐다 */
  changeRef?: Ref<HTMLParagraphElement>;
}

// 시안 '종목 시세 영역': 여백 20·24, 사이 4 (위는 스크롤 영역 위 여백 8을 합쳐 28)
// - "{이름}님의 종목" Title3 Grey/8 / 현재가 Heading1 Grey/8 / "어제보다 +110,200원 (3.0%)" Body1.5
//   ("어제보다"는 Grey/6, 금액·등락률은 상승 NSBuy·하락 NSSell·보합 Grey/6, 삼각형 없음)
function StockSummary({ stock, day, changeRef }: StockSummaryProps) {
  return (
    <section className="flex flex-col gap-1 px-6 pt-7 pb-5">
      <h2 className="text-title3 text-grey-8">{stock.ownerName}님의 종목</h2>
      <p className="text-heading1 text-grey-8">{formatNumber(stock.price)}원</p>
      <p ref={changeRef} className="text-body1-5 text-grey-6">
        {day === 1 ? '공모가보다' : '어제보다'}{' '}
        <span className={getPriceColorClass(stock.change)}>
          {formatSignedNumber(stock.change)}원 ({formatRate(stock.changeRate)})
        </span>
      </p>
    </section>
  );
}

export default StockSummary;
