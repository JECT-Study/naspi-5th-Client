// 개발용 가짜 서버(MSW, ?msw=시나리오)가 켜져 있는지. main.tsx가 MSW를 켠 뒤 알려 준다
// 실시간 구독(*.socket.ts)이 보고, 가짜 서버일 때만 mock 스트림(가짜 시세·알림)을 돌린다
// 실제 서버를 쓸 때는 웹소켓이 붙기 전까지 실시간 구독을 하지 않는다 (가짜 시세가 실제 가격을 덮어쓰지 않게)

let isEnabled = false;

export const setMockServerEnabled = (enabled: boolean) => {
  isEnabled = enabled;
};

export const isMockServerEnabled = (): boolean => isEnabled;
