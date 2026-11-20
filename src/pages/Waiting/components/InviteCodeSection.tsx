import { notify } from '@/libs/notify';

interface InviteCodeSectionProps {
  inviteCode: string;
}

const copyInviteCode = async (inviteCode: string) => {
  try {
    await navigator.clipboard.writeText(inviteCode);
    notify.success('코드가 복사되었어요.');
  } catch {
    notify.requestFailed('복사');
  }
};

// 초대 코드 + 복사 (대기실 2, 2-1). 설계서 v.1.5에서 초대 문구 복사는 빠지고 코드만 복사한다
// 시안 '초대 코드 영역': 여백 20·24·16, 제목 Title3 Grey/8, 16 띄우고 코드 상자
// - 상자: 흰색 + Grey/2 테두리, 모서리 12, 여백 14. 코드 Heading1 NSBlue, 오른쪽 복사 버튼 80×36(NSBlue, 모서리 6, Button2 흰색)
function InviteCodeSection({ inviteCode }: InviteCodeSectionProps) {
  return (
    <section className="flex flex-col gap-4 px-6 pt-5 pb-4">
      <h2 className="text-title3 text-grey-8">초대 코드</h2>
      <div className="flex items-center justify-between gap-2.5 rounded-xl border border-grey-2 bg-white p-3.5">
        <span className="text-heading1 text-ns-blue">{inviteCode}</span>
        <button
          type="button"
          className="flex h-9 w-20 shrink-0 items-center justify-center rounded-md bg-ns-blue text-button2 text-white"
          onClick={() => copyInviteCode(inviteCode)}
        >
          복사
        </button>
      </div>
    </section>
  );
}

export default InviteCodeSection;
