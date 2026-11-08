import { notify } from '@/libs/notify';

interface InviteCodeSectionProps {
  leagueName: string;
  inviteCode: string;
}

const copyText = async (text: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(text);
    notify.success(successMessage);
  } catch {
    notify.requestFailed('복사');
  }
};

// 초대 코드 + 코드 복사 / 초대 복사 (초대 문구에 바로 참여할 수 있는 링크를 넣는다)
function InviteCodeSection({ leagueName, inviteCode }: InviteCodeSectionProps) {
  // TODO: 초대 문구가 정해지면 바꾼다
  const inviteMessage = [
    `'${leagueName}' 리그에 초대해요!`,
    `참여 코드: ${inviteCode}`,
    // 초대 링크: 메인에 코드로 참여가 코드를 채운 채로 뜬다
    `${window.location.origin}/leagues?code=${inviteCode}`,
  ].join('\n');

  return (
    <section>
      <h2 className="font-bold">초대 코드</h2>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
        <span className="font-bold tracking-widest">{inviteCode}</span>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className="rounded border bg-white px-2 py-1"
            onClick={() => copyText(inviteCode, '코드가 복사되었어요.')}
          >
            코드 복사
          </button>
          <button
            type="button"
            className="rounded border bg-white px-2 py-1"
            onClick={() => copyText(inviteMessage, '초대가 복사되었어요.')}
          >
            초대 복사
          </button>
        </div>
      </div>
    </section>
  );
}

export default InviteCodeSection;
