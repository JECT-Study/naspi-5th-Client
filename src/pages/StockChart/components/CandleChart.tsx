import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  CandlestickSeries,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Bar } from '@/apis/domains/market/market.types';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import TradingViewAttribution from '@/components/TradingViewAttribution';
import ExtremeLabel, { type ExtremeLabelData } from './ExtremeLabel';

interface CandleChartProps {
  bars: Bar[];
  /** 이 종목을 갖고 있으면 평균 매입가. 차트에 점선으로 긋는다 */
  averagePrice?: number;
}

// 디자인이 나오면 이 값들만 바꾼다
const COLORS = {
  up: '#F04452',
  down: '#3182F6',
  upVolume: 'rgba(240, 68, 82, 0.3)',
  downVolume: 'rgba(49, 130, 246, 0.3)',
  text: '#9CA3AF',
  grid: '#F3F4F6',
  crosshair: '#9CA3AF',
  label: '#111827',
  averagePrice: '#6B7280',
};

// 화면에 보이는 봉 중 가장 높은 고가(빨강)·낮은 저가(파랑) 표시 (토스 방식)
// "628원 (-35.9%, 11.07 01:45)": 가격, 지금 가격이 그 가격보다 몇 % 높고 낮은지, 그 봉의 시각
const formatExtreme = (price: number, currentPrice: number, time: number) => {
  const rate = ((currentPrice - price) / price) * 100;
  const sign = rate > 0 ? '+' : '';
  return `${formatNumber(price)}원 (${sign}${rate.toFixed(1)}%, ${formatChartTime(toChartTime(time))})`;
};

// lightweight-charts는 시간을 UTC 그대로 그리므로 9시간을 더해 KST로 보이게 한다
const KST_OFFSET_SECONDS = 9 * 60 * 60;
const toChartTime = (time: number) => (time + KST_OFFSET_SECONDS) as UTCTimestamp;

// 십자선 시간 라벨: KST로 옮긴 시각을 UTC 기준으로 읽으면 KST 시각이 된다
const pad = (value: number) => String(value).padStart(2, '0');
const formatChartTime = (time: Time) => {
  const date = new Date((time as number) * 1000);
  return `${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};

const toCandle = (bar: Bar) => ({
  time: toChartTime(bar.time),
  open: bar.open,
  high: bar.high,
  low: bar.low,
  close: bar.close,
});

const toVolume = (bar: Bar) => ({
  time: toChartTime(bar.time),
  value: bar.volume,
  color: bar.close >= bar.open ? COLORS.upVolume : COLORS.downVolume,
});

interface ChartRefs {
  chart: IChartApi;
  candle: ISeriesApi<'Candlestick'>;
  volume: ISeriesApi<'Histogram'>;
}

/** 봉이 차트 왼쪽·오른쪽 이 비율 안에 있으면 글자를 안쪽으로 붙인다 */
const EDGE_RATIO = 0.3;

// 보이는 구간(논리 인덱스 from~to)에서 고가가 가장 높은 봉과 저가가 가장 낮은 봉
const findExtremes = (bars: Bar[], from: number, to: number) => {
  const start = Math.max(0, Math.ceil(from));
  const end = Math.min(bars.length - 1, Math.floor(to));
  let highest: Bar | undefined;
  let lowest: Bar | undefined;
  for (let i = start; i <= end; i++) {
    const bar = bars[i];
    if (!highest || bar.high > highest.high) highest = bar;
    if (!lowest || bar.low < lowest.low) lowest = bar;
  }
  return { highest, lowest };
};

// 캔들 + 거래량. 처음(또는 간격이 바뀌면) setData로 다시 그리고, 실시간으로 바뀐 봉만 update한다
// 차트 위에는 손가락(마우스)을 올린 봉, 없으면 마지막 봉의 시가·고가·저가·종가·거래량을 보여준다
// 보이는 구간의 최고 고가·최저 저가는 차트 안에 "최고 / 최저"로 표시한다
function CandleChart({ bars, averagePrice }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ChartRefs | null>(null);
  const renderedBarsRef = useRef<Bar[]>([]);
  const averagePriceLineRef = useRef<IPriceLine | null>(null);
  const [hoveredBar, setHoveredBar] = useState<Bar | null>(null);
  const [extremeLabels, setExtremeLabels] = useState<{
    high: ExtremeLabelData;
    low: ExtremeLabelData;
  } | null>(null);
  const extremeFrameRef = useRef(0);

  // 보이는 봉 중 최고 고가(봉 위)·최저 저가(봉 아래)의 위치와 글자를 구한다
  // 데이터를 바꾼 직후에는 가격 축이 아직 다시 계산되지 않았을 수 있어서 다음 프레임에 잰다
  const updateExtremes = useEffectEvent(() => {
    cancelAnimationFrame(extremeFrameRef.current);
    extremeFrameRef.current = requestAnimationFrame(() => {
      const refs = chartRef.current;
      const range = refs?.chart.timeScale().getVisibleLogicalRange();
      const bars = renderedBarsRef.current;
      const currentPrice = bars[bars.length - 1]?.close;
      if (!refs || !range || currentPrice === undefined) return setExtremeLabels(null);
      const { highest, lowest } = findExtremes(bars, range.from, range.to);
      if (!highest || !lowest) return setExtremeLabels(null);

      const width = refs.chart.timeScale().width();
      const toLabel = (bar: Bar, price: number): ExtremeLabelData | null => {
        const x = refs.chart.timeScale().timeToCoordinate(toChartTime(bar.time));
        const y = refs.candle.priceToCoordinate(price);
        if (x === null || y === null) return null;
        const align =
          x < width * EDGE_RATIO ? 'left' : x > width * (1 - EDGE_RATIO) ? 'right' : 'center';
        return { x, y, align, text: formatExtreme(price, currentPrice, bar.time) };
      };
      const high = toLabel(highest, highest.high);
      const low = toLabel(lowest, lowest.low);
      setExtremeLabels(high && low ? { high, low } : null);
    });
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      // 라이브러리 로고는 끄고 차트 아래에 TradingViewAttribution을 둔다 (거래량을 가리지 않게)
      layout: {
        attributionLogo: false,
        background: { color: 'transparent' },
        textColor: COLORS.text,
        fontSize: 11,
        fontFamily: getComputedStyle(document.body).fontFamily,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: COLORS.grid },
      },
      rightPriceScale: { borderVisible: false },
      // 차트 위에서 위아래로 쓸면 차트가 아니라 페이지가 스크롤되게 한다 (좌우는 차트 이동)
      handleScroll: { vertTouchDrag: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 9,
        minBarSpacing: 4,
        rightOffset: 3,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: COLORS.crosshair,
          style: LineStyle.LargeDashed,
          labelBackgroundColor: COLORS.label,
        },
        horzLine: {
          color: COLORS.crosshair,
          style: LineStyle.LargeDashed,
          labelBackgroundColor: COLORS.label,
        },
      },
      localization: {
        locale: 'ko-KR',
        timeFormatter: formatChartTime,
        priceFormatter: (price: number) => formatNumber(Math.round(price)),
      },
    });
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.up,
      downColor: COLORS.down,
      wickUpColor: COLORS.up,
      wickDownColor: COLORS.down,
      borderVisible: false,
      priceLineStyle: LineStyle.Dotted,
      priceFormat: { type: 'price', precision: 0, minMove: 100 },
    });
    // 캔들은 가운데, 거래량은 아래쪽 20%에 그려서 겹치지 않게 한다
    // 위·아래 여백은 최고·최저 표시 글자가 들어갈 자리
    candle.priceScale().applyOptions({ scaleMargins: { top: 0.15, bottom: 0.3 } });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    // 손가락(마우스)을 올린 봉을 찾아 왼쪽 위 정보에 보여준다. 차트 밖이면 마지막 봉
    chart.subscribeCrosshairMove((param) => {
      if (param.time === undefined) {
        setHoveredBar(null);
        return;
      }
      const chartTime = param.time as number;
      setHoveredBar(
        renderedBarsRef.current.find((bar) => toChartTime(bar.time) === chartTime) ?? null,
      );
    });

    chartRef.current = { chart, candle, volume };

    // 좌우로 움직이거나 크기가 바뀌면 최고·최저를 다시 찾아 옮긴다
    const handleRangeChange = () => updateExtremes();
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);
    chart.timeScale().subscribeSizeChange(handleRangeChange);
    return () => {
      cancelAnimationFrame(extremeFrameRef.current);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      chart.timeScale().unsubscribeSizeChange(handleRangeChange);
      chart.remove();
      chartRef.current = null;
      renderedBarsRef.current = [];
      averagePriceLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const refs = chartRef.current;
    if (!refs) return;
    const rendered = renderedBarsRef.current;
    renderedBarsRef.current = bars;

    // 처음 그리거나 다른 봉 목록(간격 변경)이면 통째로 다시 그린다
    const isNewData = rendered.length === 0 || rendered[0]?.time !== bars[0]?.time;
    if (isNewData || bars.length < rendered.length) {
      refs.candle.setData(bars.map(toCandle));
      refs.volume.setData(bars.map(toVolume));
      refs.chart.timeScale().scrollToRealTime();
      updateExtremes();
      return;
    }

    // 바뀐 봉부터 끝까지 update. 실시간 반영은 바뀐 봉만 새 객체로 바꾸므로 참조로 비교한다
    const firstChanged = bars.findIndex((bar, i) => bar !== rendered[i]);
    if (firstChanged < 0) return;
    bars.slice(firstChanged).forEach((bar, offset) => {
      const isHistorical = firstChanged + offset < rendered.length - 1;
      refs.candle.update(toCandle(bar), isHistorical);
      refs.volume.update(toVolume(bar), isHistorical);
    });
    // 실시간으로 고가·저가가 바뀌면 최고·최저도 바뀔 수 있다
    updateExtremes();
  }, [bars]);

  // 평균 매입가 회색 점선: 보유하면 긋고, 값이 바뀌면 옮기고, 다 팔면 지운다
  useEffect(() => {
    const refs = chartRef.current;
    if (!refs) return;
    const line = averagePriceLineRef.current;
    if (!averagePrice) {
      if (line) refs.candle.removePriceLine(line);
      averagePriceLineRef.current = null;
      return;
    }
    if (line) {
      line.applyOptions({ price: averagePrice });
      return;
    }
    averagePriceLineRef.current = refs.candle.createPriceLine({
      price: averagePrice,
      color: COLORS.averagePrice,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      // 회색 점선만으로 알아보기 쉬워서 "평균 매입가" 글자는 붙이지 않는다. 축에는 가격만
      axisLabelVisible: true,
    });
  }, [averagePrice]);

  const legendBar = hoveredBar ?? bars[bars.length - 1];
  const isUp = legendBar ? legendBar.close >= legendBar.open : true;

  return (
    <div className="flex flex-col gap-2">
      {/* 차트와 겹치지 않게 차트 위에 따로 둔다. 봉이 없어도 자리를 지켜 차트가 들썩이지 않게 한다 */}
      <dl className={cn('flex h-4 gap-2 text-[10px]', isUp ? 'text-[#F04452]' : 'text-[#3182F6]')}>
        {legendBar && (
          <>
            {(
              [
                ['시', legendBar.open],
                ['고', legendBar.high],
                ['저', legendBar.low],
                ['종', legendBar.close],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex gap-0.5">
                <dt className="text-gray-400">{label}</dt>
                <dd>{formatNumber(value)}</dd>
              </div>
            ))}
            <div className="flex gap-0.5">
              <dt className="text-gray-400">거래량</dt>
              <dd className="text-gray-500">{formatNumber(legendBar.volume)}</dd>
            </div>
          </>
        )}
      </dl>
      <div className="relative">
        <div ref={containerRef} className="h-72 w-full" />
        {extremeLabels && (
          <>
            <ExtremeLabel kind="high" label={extremeLabels.high} color={COLORS.up} />
            <ExtremeLabel kind="low" label={extremeLabels.low} color={COLORS.down} />
          </>
        )}
      </div>
      <TradingViewAttribution />
    </div>
  );
}

export default CandleChart;
