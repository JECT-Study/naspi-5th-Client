import { useEffect, useRef } from 'react';
import {
  AreaSeries,
  LineSeries,
  LineStyle,
  createChart,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { AssetHistoryPoint } from '@/apis/domains/league/league.types';
import TradingViewAttribution from '@/components/TradingViewAttribution';

interface AssetHistoryChartProps {
  history: AssetHistoryPoint[];
}

// lightweight-charts는 시간을 UTC 그대로 그리므로 9시간을 더해 KST 날짜로 보이게 한다
const KST_OFFSET_SECONDS = 9 * 60 * 60;
/** 시작 자산 (서비스 정책 4.2: 1억 원). 기준선으로 긋는다 */
const INITIAL_ASSET = 100_000_000;

// 디자인이 나오면 이 값들만 바꾼다
const COLORS = {
  total: '#111827',
  totalAreaTop: 'rgba(17, 24, 39, 0.12)',
  totalAreaBottom: 'rgba(17, 24, 39, 0)',
  cash: '#3182F6',
  stockValue: '#F59E0B',
  text: '#9CA3AF',
  grid: '#F3F4F6',
  baseline: '#9CA3AF',
};

// 범례 순서 = 그리는 순서
const SERIES = [
  { key: 'totalAsset', label: '총자산', color: COLORS.total },
  { key: 'cash', label: '현금', color: COLORS.cash },
  { key: 'stockValue', label: '보유 주식 평가금액', color: COLORS.stockValue },
] as const;

const formatManWon = (price: number) => `${Math.round(price / 10_000).toLocaleString('ko-KR')}만`;

// 내 자산 추이 (리그 결과 2): 일차별 현금, 보유 주식 평가금액, 총자산 (단위: 만 원) + 시작 1억 기준선
function AssetHistoryChart({ history }: AssetHistoryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      // 라이브러리 로고는 끄고 차트 아래에 TradingViewAttribution을 둔다
      layout: {
        attributionLogo: false,
        background: { color: 'transparent' },
        textColor: COLORS.text,
        fontSize: 11,
        fontFamily: getComputedStyle(document.body).fontFamily,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: COLORS.grid } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });
    const priceFormat = { type: 'custom', formatter: formatManWon } as const;
    const toData = (key: (typeof SERIES)[number]['key']) =>
      history.map((point) => ({
        time: (point.time + KST_OFFSET_SECONDS) as UTCTimestamp,
        value: point[key],
      }));

    const total = chart.addSeries(AreaSeries, {
      lineColor: COLORS.total,
      lineWidth: 2,
      topColor: COLORS.totalAreaTop,
      bottomColor: COLORS.totalAreaBottom,
      priceLineVisible: false,
      priceFormat,
    });
    total.setData(toData('totalAsset'));
    total.createPriceLine({
      price: INITIAL_ASSET,
      color: COLORS.baseline,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: false,
      title: '시작',
    });

    SERIES.filter(({ key }) => key !== 'totalAsset').forEach(({ key, color }) => {
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat,
      });
      series.setData(toData(key));
    });
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [history]);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        {SERIES.map(({ key, label, color }) => (
          <li key={key} className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </li>
        ))}
      </ul>
      <div ref={containerRef} className="h-56 w-full" />
      <TradingViewAttribution />
    </div>
  );
}

export default AssetHistoryChart;
