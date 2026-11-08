import { cn } from '@/utils/cn';

export interface ExtremeLabelData {
  /** 봉의 가로 위치 (차트 영역 기준 px) */
  x: number;
  /** 고점은 고가, 저점은 저가의 세로 위치 (px) */
  y: number;
  text: string;
  /** 차트 끝에 가까우면 글자가 잘리지 않게 안쪽으로 붙인다 */
  align: 'left' | 'center' | 'right';
}

interface ExtremeLabelProps {
  kind: 'high' | 'low';
  label: ExtremeLabelData;
  color: string;
}

/** 화살표와 봉 사이 간격, 화살표 높이 (px) */
const GAP = 3;
const ARROW_HEIGHT = 12;

const ALIGN_TRANSFORM = {
  left: 'translateX(-6px)',
  center: 'translateX(-50%)',
  right: 'translateX(calc(-100% + 6px))',
};

// 차트 위 최고·최저 표시 (토스 방식): 고점은 글자 아래 ↓, 저점은 ↑ 아래 글자
// 화살표는 봉 바로 위·아래에, 글자는 차트 끝에서 잘리지 않게 왼쪽·가운데·오른쪽으로 맞춘다
function ExtremeLabel({ kind, label, color }: ExtremeLabelProps) {
  const isHigh = kind === 'high';
  const arrowTop = isHigh ? label.y - GAP - ARROW_HEIGHT : label.y + GAP;
  const textTop = isHigh ? arrowTop - 14 : arrowTop + ARROW_HEIGHT;

  return (
    // z-10: 차트 그림판(canvas)이 z-index 1~2라서 그보다 위에 둬야 눈금선·가격선이 글자를 가로지르지 않는다
    <div className="pointer-events-none absolute inset-0 z-10" style={{ color }}>
      <span
        aria-hidden="true"
        className="absolute text-[11px] leading-3"
        style={{ left: label.x, top: arrowTop, transform: 'translateX(-50%)' }}
      >
        {isHigh ? '↓' : '↑'}
      </span>
      {/* 흰 배경: 가로 눈금선·가격선이 글자 위로 지나가 잘려 보이지 않게 가린다 */}
      <span
        className={cn(
          'absolute rounded-sm bg-white px-0.5 text-[10px] leading-3.5 whitespace-nowrap',
        )}
        style={{ left: label.x, top: textTop, transform: ALIGN_TRANSFORM[label.align] }}
      >
        {label.text}
      </span>
    </div>
  );
}

export default ExtremeLabel;
