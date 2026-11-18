import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// index.css @theme에 추가한 디자인 시스템 이름을 tailwind-merge에 알려준다
// 알려주지 않으면 text-heading1을 글자색으로 보고, cn('text-grey-8', 'text-heading1')에서 글자색을 지워 버린다
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'heading1',
        'heading2',
        'heading2-5',
        'heading3',
        'heading4',
        'title1',
        'title1-5',
        'title1-5m',
        'title2',
        'title2-5',
        'title3',
        'title4',
        'title4-t',
        'title4-5',
        'body1',
        'body1-5',
        'body2',
        'body2-5',
        'body3',
        'body3-t',
        'caption1',
        'button1',
        'button2',
        'button2-5',
        'button3',
        'button3-5',
      ],
      shadow: ['modal'],
      container: ['app'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
