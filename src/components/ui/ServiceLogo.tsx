import logoImage2x from '@/assets/images/league@2x.png';
import logoImage3x from '@/assets/images/league@3x.png';

// 서비스 로고 (시안: 로그인·완료 안내 모달 위쪽). 이미지 24 + 간격 4 + 로고 글자
// 로고 원본이 아직 없어 시안처럼 리그 대표 이미지와 같은 새 얼굴 + "로고" 글자로 둔다. 원본이 나오면 이 파일만 바꾼다
function ServiceLogo() {
  return (
    <div className="flex items-center gap-1">
      <img
        src={logoImage2x}
        srcSet={`${logoImage2x} 2x, ${logoImage3x} 3x`}
        alt=""
        width={24}
        height={24}
        className="size-6"
      />
      <span className="text-lg leading-5 font-bold text-grey-8">로고</span>
    </div>
  );
}

export default ServiceLogo;
