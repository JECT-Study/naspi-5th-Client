import type { WaitingMember } from '@/apis/domains/room/room.types';
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown';
import { MoreIcon } from '@/components/ui/icons';
import StockAvatar from '@/components/stock/StockAvatar';
import { cn } from '@/utils/cn';

interface MemberRowProps {
  member: WaitingMember;
  /** 점 3개 메뉴 항목. 없으면 메뉴를 그리지 않는다 */
  actions?: DropdownItem[];
}

// 대기실 참여자 한 줄 (시안 List/참여자): 높이 54, 좌우 4, 사이 8, 모서리 6
// - 상장 완료: SubBlue2 바탕. 종목 프로필 + 종목 이름(Title4 Grey/8) / 아랫줄 상장자 이름(Grey/8) + 종목 소개(Grey/5)
// - 상장 대기: 흰 바탕, 프로필 없음. 이름(Title4 Grey/8) / 아랫줄 "아직 종목을 상장하지 않았어요."(Grey/5)
// - 아랫줄은 Body3 높이 14, 두 줄 사이 3
// - 오른쪽: "상장 완료"·"상장 대기"(Title4 Grey/6, 56×28) + 메뉴가 있으면 점 3개(18, Grey/6), 좌우 8
function MemberRow({ member, actions = [] }: MemberRowProps) {
  const { stock } = member;

  return (
    <div
      className={cn(
        'flex h-13.5 items-center gap-2 rounded-md px-1',
        stock ? 'bg-sub-blue-2' : 'bg-white',
      )}
    >
      {stock && <StockAvatar name={stock.name} />}
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <p className="truncate text-title4 text-grey-8">{stock ? stock.name : member.name}</p>
        {/* 시안은 Body3(t)(글자 위아래 여백 자름) + 위아래 3으로 높이 14
            소개는 말줄임(overflow hidden)이라 자른 글자는 위아래가 잘려 보여서, 같은 크기의 Body3를 줄 높이 14로 둔다 */}
        <p className="flex min-w-0 gap-0.75 text-body3 leading-3.5">
          {stock ? (
            <>
              <span className="shrink-0 text-grey-8">{member.name}</span>
              <span className="truncate text-grey-5">{stock.description}</span>
            </>
          ) : (
            <span className="truncate text-grey-5">아직 종목을 상장하지 않았어요.</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center px-2">
        <span className="flex h-7 w-14 items-center justify-center text-title4 text-grey-6">
          {stock ? '상장 완료' : '상장 대기'}
        </span>
        {actions.length > 0 && (
          <Dropdown
            label={`${member.name} 메뉴`}
            icon={<MoreIcon size={18} className="text-grey-6" />}
            // 아이콘은 18이지만 누르는 범위는 위아래·좌우로 넓힌다 (자리는 그대로)
            buttonClassName="-m-2 flex p-2"
            items={actions}
          />
        )}
      </div>
    </div>
  );
}

export default MemberRow;
