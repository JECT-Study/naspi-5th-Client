// 앱 틀(layouts/App/AppFrame) 안에 덮개(모달·바텀시트·이미지 뷰어)를 그리기 위한 자리
// 덮개의 어두운 배경은 브라우저 화면 전체가 아니라 가운데 앱 틀(최대 599)만 덮는다 (드로어와 같게, 사용자 결정)
// 앱 틀은 화면 높이에 고정되고 넘치는 부분을 잘라서, 그 안에서 absolute로 깔면 화면을 꽉 채운다
// 앱 틀에는 transform이 없어 덮개 위치가 틀어지지 않는다 (페이지 안 transform의 영향을 피하려고 portal은 그대로 쓴다)

export const APP_FRAME_ID = 'app-frame';

/** 덮개를 그릴 곳. 앱 틀이 아직 없으면(테스트 등) body */
export const getOverlayRoot = (): HTMLElement =>
  document.getElementById(APP_FRAME_ID) ?? document.body;
