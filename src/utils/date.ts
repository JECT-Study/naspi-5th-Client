const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// KST 기준 날짜 번호 (1970-01-01부터 며칠째인지)
const toKstDayNumber = (date: Date) => Math.floor((date.getTime() + KST_OFFSET_MS) / DAY_MS);

/** KST 날짜 기준으로 target까지 남은 일수. 오늘이면 0, 지났으면 음수 */
export const getDaysUntil = (target: Date, now: Date = new Date()): number =>
  toKstDayNumber(target) - toKstDayNumber(now);

/** 남은 일수 → `D-3`, 당일이나 지난 경우 `D-Day` */
export const formatDday = (days: number): string => (days <= 0 ? 'D-Day' : `D-${days}`);

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** 지난 시간 `방금 전`, `5분 전`, `2시간 전`, `3일 전` */
export const formatRelativeTime = (date: Date, now: Date = new Date()): string => {
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE_MS) return '방금 전';
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}분 전`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}시간 전`;
  return `${Math.floor(elapsed / DAY_MS)}일 전`;
};

const kstDateFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** KST 기준 `YYYY.MM.DD` (화면설계서 공통: 일자 형식) */
export const formatKstDate = (date: Date): string => {
  const parts = kstDateFormat.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${get('year')}.${get('month')}.${get('day')}`;
};

const kstTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** KST 기준 `YYYY.MM.DD HH:MM` (화면설계서 공통: 일시 형식) */
export const formatKstDateTime = (date: Date): string => {
  const parts = kstTimeFormat.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${formatKstDate(date)} ${get('hour')}:${get('minute')}`;
};
