import mascot2x from '@/assets/images/error-mascot@2x.png';
import mascot3x from '@/assets/images/error-mascot@3x.png';

// 오류·빈 화면 안내 그림 (시안: 파란 새 마스코트 150×161, 디자이너가 직접 만든 이미지)
// 공통 오류 페이지, 조회 실패 안내, 빈 화면(리그 없음, 공시 없음)에서 같이 쓴다
function ErrorIllustration() {
  return (
    <img
      src={mascot2x}
      srcSet={`${mascot2x} 2x, ${mascot3x} 3x`}
      alt=""
      width={150}
      height={161}
      className="h-40.25 w-37.5 shrink-0"
    />
  );
}

export default ErrorIllustration;
