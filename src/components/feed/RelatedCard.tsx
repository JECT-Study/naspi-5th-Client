import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRightIcon } from '@/components/ui/icons';

// 공시 상세의 '관련 뉴스', 뉴스 상세의 '관련 공시' 카드 (시안 Card/관련뉴스·뉴스오류·관련공시·공시삭제)
// 흰색, 여백 위아래 12·좌우 16, 줄 사이 8, 라벨 Button3.5 Grey/6
// 문구는 설계서 "관련 뉴스"·"관련 공시" (시안은 붙여 씀)
// TODO: 배경 이미지는 디자이너가 나중에 새로 주기로 함. 받으면 카드 배경에 넣는다 (시안의 이미지(40%)는 임시라 넣지 않음)

const LABEL_CLASS = 'text-button3-5 text-grey-6';

interface RelatedLinkCardProps {
  label: string;
  to: string;
  title: string;
  /** 라벨 줄 오른쪽 (관련 뉴스의 호재·악재 칩) */
  chip?: ReactNode;
}

// 이어지는 글이 있을 때: [라벨 / 칩] → [제목 Title4 Grey/8 한 줄 / Right 18 Grey/6], 카드 전체가 링크
export function RelatedLinkCard({ label, to, title, chip }: RelatedLinkCardProps) {
  return (
    <Link to={to} className="flex flex-col gap-2 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL_CLASS}>{label}</span>
        {chip}
      </div>
      <div className="flex items-center gap-2.5">
        <span className="min-w-0 flex-1 truncate text-title4 text-grey-8">{title}</span>
        <ChevronRightIcon className="text-grey-6" />
      </div>
    </Link>
  );
}

interface RelatedNoticeCardProps {
  label: string;
  /** 라벨 아래 안내 (FieldMessage) */
  message: ReactNode;
  /** 오른쪽 버튼 (뉴스 생성 실패의 다시 시도) */
  action?: ReactNode;
}

// 이어지는 글이 없을 때(뉴스 생성 실패, 원문 공시 삭제): [라벨 → 안내] + 오른쪽 버튼, 위아래 Grey/2 선
// 시안 높이 72: 위아래 선(1)이 여백 12 바깥에 더해진다
export function RelatedNoticeCard({ label, message, action }: RelatedNoticeCardProps) {
  return (
    <section className="flex items-center justify-between gap-2 bg-white px-4 py-3.25 shadow-[inset_0_1px_0_var(--color-grey-2),inset_0_-1px_0_var(--color-grey-2)]">
      <div className="flex min-w-0 flex-col gap-2">
        <span className={LABEL_CLASS}>{label}</span>
        {message}
      </div>
      {action}
    </section>
  );
}
