// mock 응답에 네트워크 지연을 흉내 낸다 (로딩 화면 확인용)
export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
