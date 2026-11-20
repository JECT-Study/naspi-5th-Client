import { cn } from '@/utils/cn';

interface StockAvatarProps {
  name: string;
  /**
   * preview: 상장 전 미리보기 (새 리그·종목 상장). 아직 종목 색이 없어 NSSell 바탕, 이름이 비면 "종"
   * 없으면 종목 이름으로 정한 임시 종목 색
   */
  tone?: 'preview';
  className?: string;
}

// 시안 종목 색 10가지 (index.css --color-stock-1~10). 클래스 이름을 그대로 적어 둬야 Tailwind가 만든다
const STOCK_COLOR_CLASSES = [
  'bg-stock-1',
  'bg-stock-2',
  'bg-stock-3',
  'bg-stock-4',
  'bg-stock-5',
  'bg-stock-6',
  'bg-stock-7',
  'bg-stock-8',
  'bg-stock-9',
  'bg-stock-10',
];

// TODO: 리그 API 연동 때 배정 규칙(참여자마다 겹치지 않게)으로 바꾼다
// 그전까지는 같은 이름이면 늘 같은 색이 나오도록 이름 글자 코드의 합으로 고른다 (겹칠 수 있음)
const getTemporaryColorClass = (name: string) => {
  const sum = Array.from(name).reduce((total, char) => total + (char.codePointAt(0) ?? 0), 0);
  return STOCK_COLOR_CLASSES[sum % STOCK_COLOR_CLASSES.length];
};

// 종목 프로필 (시안 종목 아바타): 36 원, 종목 색 바탕 가운데 종목 이름의 첫 글자 Title2 흰색
// 바탕색은 화면설계서의 회색 대신 시안의 종목 색을 쓴다 (사용자 결정, 설계서가 늦은 부분)
function StockAvatar({ name, tone, className }: StockAvatarProps) {
  // 이모지처럼 두 단위로 된 글자도 한 글자로 자르도록 Array.from을 쓴다
  const initial = Array.from(name.trim())[0] ?? (tone === 'preview' ? '종' : '');

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-title2 text-white',
        tone === 'preview' ? 'bg-ns-sell' : getTemporaryColorClass(name.trim()),
        className,
      )}
    >
      {initial}
    </div>
  );
}

export default StockAvatar;
