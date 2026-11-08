import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { loginWithKakao } from '@/apis/domains/auth/auth.service';
import Button from './Button';
import FieldMessage from './FieldMessage';
import Modal from './Modal';
import NameFormModal from './NameFormModal';
import { KeepOnSessionExpiredContext } from './sessionModalContext';

interface LoginModalProps {
  /** login: 랜딩의 로그인 (공통 2), expired: 세션 만료 후 재로그인 안내 (공통 2-2) */
  variant: 'login' | 'expired';
  /** 로그인(과 필요하면 이름 입력)을 마쳤을 때 */
  onLoggedIn: () => void;
}

type LoginStep = 'login' | 'name';

// 로그인 모달: 카카오 로그인 → 이름이 유효하면 끝, 아니면 이름 입력 모달(공통 3)
// 인증에 실패하면 로그인 실패 안내(공통 2-1)를 함께 보여준다. 닫는 버튼이 없다
function LoginModal({ variant, onLoggedIn }: LoginModalProps) {
  const [step, setStep] = useState<LoginStep>('login');
  const { mutate, isPending, isError } = useMutation({
    mutationFn: loginWithKakao,
    onSuccess: ({ isNameRequired }) => {
      if (isNameRequired) setStep('name');
      else onLoggedIn();
    },
    // 실패는 모달 안에 로그인 실패 안내(공통 2-1)로 보여주므로 공통 토스트를 띄우지 않는다
    meta: { handledErrors: 'all' },
  });

  // 로그인 모달과 이름 입력 모달은 세션이 만료된 동안에도 보여야 한다 (나머지 모달은 숨김)
  return (
    <KeepOnSessionExpiredContext value={true}>
      {step === 'name' ? (
        <NameFormModal title="이름을 입력해 주세요." onSaved={onLoggedIn} />
      ) : (
        renderLogin()
      )}
    </KeepOnSessionExpiredContext>
  );

  function renderLogin() {
    return (
      <Modal
        title={variant === 'expired' ? '다시 로그인해 주세요.' : '로고'}
        description={
          variant === 'expired'
            ? '로그인 시간이 만료되었어요.'
            : '친구들과 소통하고,\n주식 투자로 경쟁해 보세요!'
        }
        footer={
          <div className="flex w-full flex-col items-center gap-3">
            {/* TODO: 카카오 로그인 버튼 디자인 (카카오 디자인 가이드) */}
            <Button
              className="h-11 w-full bg-[#FEE500] text-gray-900"
              isPending={isPending}
              pendingLabel="로그인 중..."
              onClick={() => mutate()}
            >
              카카오 로그인
            </Button>
            {/* 로그인 실패 안내 (공통 2-1): Figma처럼 같은 로그인 모달 안에 문구를 띄운다 */}
            {isError && (
              <FieldMessage>로그인을 완료하지 못했어요. 다시 시도해 주세요.</FieldMessage>
            )}
          </div>
        }
      />
    );
  }
}

export default LoginModal;
