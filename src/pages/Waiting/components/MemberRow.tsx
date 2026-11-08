import type { WaitingMember } from '@/apis/domains/room/room.types';
import Dropdown, { type DropdownItem } from '@/components/Dropdown';
import { MoreIcon } from '@/components/icons';
import StockAvatar from '@/components/StockAvatar';

interface MemberRowProps {
  member: WaitingMember;
  /** 점 3개 메뉴 항목. 없으면 메뉴를 그리지 않는다 */
  actions?: DropdownItem[];
}

// 대기실 참여자 한 줄: 상장했으면 종목 프로필·이름·소개 + 상장자 이름, 대기 중이면 이름만
function MemberRow({ member, actions = [] }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {member.stock ? (
        <>
          <StockAvatar name={member.stock.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{member.stock.name}</p>
            <p className="truncate text-sm text-gray-500">{member.stock.description}</p>
          </div>
          <span className="shrink-0 text-sm text-gray-500">{member.name}</span>
        </>
      ) : (
        <>
          <div className="size-9 shrink-0 rounded-full bg-gray-100" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate">{member.name}</p>
        </>
      )}
      {actions.length > 0 && (
        <Dropdown
          label={`${member.name} 메뉴`}
          icon={<MoreIcon className="size-5" />}
          items={actions}
        />
      )}
    </div>
  );
}

export default MemberRow;
