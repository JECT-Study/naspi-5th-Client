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
function InviteCodeSection({ inviteCode }: InviteCodeSectionProps) {
  return (
    <section>
      <h2 className="font-bold">초대 코드</h2>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
        <span className="font-bold tracking-widest">{inviteCode}</span>
        <button
          type="button"
          className="rounded border bg-white px-2 py-1 text-xs"
          onClick={() => copyInviteCode(inviteCode)}
        >
          복사
        </button>
      </div>
    </section>
  );
}

export default InviteCodeSection;
