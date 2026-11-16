import { useEffect, useState } from 'react';
import { startKakaoLogin } from '@/apis/domains/auth/auth.service';
import { saveLoginReturnPath } from '@/libs/loginReturnPath';
import Button from './Button';
import FieldMessage from './FieldMessage';
import Modal from './Modal';

interface LoginModalProps {
  /** login: 랜딩의 로그인 (공통 2), expired: 세션 만료 후 재로그인 안내 (공통 2-2) */
  variant: 'login' | 'expired';
  /** 로그인 후 돌아갈 앱 안의 주소 (예: /leagues/1/stocks/3). 없으면 메인으로 간다 */
  returnPath?: string;
  /** 로그인 실패 안내(공통 2-1): 카카오 로그인 버튼 아래에 실패 문구를 함께 보여준다 */
  hasError?: boolean;
  /** X 버튼·바깥 클릭으로 닫을 때 */
  onClose: () => void;
}

// 로그인 모달: '카카오 로그인'을 누르면 백엔드의 카카오 로그인으로 페이지를 이동한다. X 버튼으로 닫을 수 있다
// 로그인 결과는 백엔드가 보내 주는 주소에서 처리한다 (성공 /, 이름 입력 /signup, 실패 /login-failure)
// 백엔드는 성공하면 항상 / 로 보내므로, 돌아갈 주소를 미리 저장해 두고 랜딩이 그리로 보낸다 (libs/loginReturnPath)
function LoginModal({ variant, returnPath, hasError = false, onClose }: LoginModalProps) {
  // 누른 뒤 페이지가 넘어가기 전까지 버튼을 막아 두 번 이동하지 않게 한다
  const [isMoving, setIsMoving] = useState(false);

  // 카카오 화면에서 뒤로 가기로 돌아오면 브라우저가 떠나기 직전 화면을 그대로 되살린다 (bfcache)
  // 그러면 버튼이 '로그인 중...'에 멈춰 있으므로 다시 누를 수 있게 푼다
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsMoving(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleLogin = () => {
    setIsMoving(true);
    saveLoginReturnPath(returnPath);
    startKakaoLogin();
  };

  return (
    <Modal
      title={variant === 'expired' ? '다시 로그인해 주세요.' : '로고'}
      description={
        variant === 'expired'
          ? '로그인 시간이 만료되었어요.'
          : '친구들과 소통하고,\n주식 투자로 경쟁해 보세요!'
      }
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col items-center gap-3">
          {/* TODO: 카카오 로그인 버튼 디자인 (카카오 디자인 가이드) */}
          <Button
            className="h-11 w-full bg-[#FEE500] text-gray-900"
            isPending={isMoving}
            pendingLabel="로그인 중..."
            onClick={handleLogin}
          >
            카카오 로그인
          </Button>
          {hasError && <FieldMessage>로그인을 완료하지 못했어요. 다시 시도해 주세요.</FieldMessage>}
        </div>
      }
    />
  );
}

export default LoginModal;
