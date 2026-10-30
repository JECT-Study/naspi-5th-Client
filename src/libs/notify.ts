// 알림 라이브러리 결정 전까지는 콘솔 출력
export const notify = {
  error: (message: string) => console.error(message),
  success: (message: string) => console.info(message),
};
