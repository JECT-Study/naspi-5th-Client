import { useEffect, useState } from 'react';
import { startKakaoLogin } from '@/apis/domains/auth/auth.service';
import { saveLoginReturnPath } from '@/libs/loginReturnPath';
import FieldMessage from './FieldMessage';
import { KakaoIcon } from './icons';
import Modal from './Modal';
import ServiceLogo from './ServiceLogo';

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

// 로그인 모달 (시안 SignIn default·expired·error): 로고 + 안내 + 카카오 로그인 버튼. X 버튼으로 닫을 수 있다
// 로고와 안내 사이 16, 안내·버튼·실패 문구 사이 24
// '카카오 로그인'을 누르면 백엔드의 카카오 로그인으로 페이지를 이동한다
// 로그인 결과는 백엔드가 보내 주는 주소에서 처리한다 (성공 /, 이름 입력 /signup, 실패 /login-failure)
// 백엔드는 성공하면 항상 / 로 보내므로, 돌아갈 주소를 미리 저장해 두고 랜딩이 그리로 보낸다 (libs/loginReturnPath)
function LoginModal({ variant, returnPath, hasError = false, onClose }: LoginModalProps) {
  // 누른 뒤 페이지가 넘어가기 전까지 버튼을 막아 두 번 이동하지 않게 한다
  const [isMoving, setIsMoving] = useState(false);

  // 카카오 화면에서 뒤로 가기로 돌아오면 브라우저가 떠나기 직전 화면을 그대로 되살린다 (bfcache)
  // 그러면 버튼이 막힌 채로 멈춰 있으므로 다시 누를 수 있게 푼다
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

  const isExpired = variant === 'expired';

  return (
    <Modal
      top={
        <div className="mb-2">
          <ServiceLogo />
        </div>
      }
      title={isExpired ? '다시 로그인해 주세요.' : '친구들과 소통하고,\n주식 투자로 경쟁해 보세요!'}
      // 만료 안내는 설명보다 큰 Title3 (시안 SignIn expired)
      description={isExpired && <span className="text-title3">로그인 시간이 만료되었어요.</span>}
      onClose={onClose}
    >
      {/* 카카오 로그인 버튼: 공식 이미지 대신 카카오 로그인 디자인 가이드의 직접 제작 규정을 따라 만든다
          (developers.kakao.com 카카오 로그인 > 디자인 가이드: 표준 버튼은 권장, 규정을 지키면 직접 제작 가능)
          - 바탕 #FEE500, 심볼 검정(모양·비율·색 변경 금지), 레이블 "카카오 로그인" 검정 85%
          - 글꼴은 OS 기본 시스템 서체 (앱 글꼴 아님), 모서리·글자 크기는 시안의 공식 컴포넌트 md 값(모서리 6, 15px)
          - 가로로 늘릴 때 심볼은 레이블과 함께 가운데 */}
      <button
        type="button"
        className="mt-4 flex h-11.25 w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] px-3.5 font-[system-ui,-apple-system,sans-serif] text-[15px] leading-[1.5] font-semibold text-black/85 disabled:opacity-60"
        disabled={isMoving}
        aria-busy={isMoving || undefined}
        onClick={handleLogin}
      >
        <KakaoIcon className="text-black" />
        카카오 로그인
      </button>
      {hasError && (
        <FieldMessage className="mt-4">
          로그인을 완료하지 못했어요. 다시 시도해 주세요.
        </FieldMessage>
      )}
    </Modal>
  );
}

export default LoginModal;
