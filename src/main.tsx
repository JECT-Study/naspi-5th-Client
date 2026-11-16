import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from '@/App';
import { queryClient } from '@/libs/queryClient';
import './index.css';

// 개발 모드에서만 MSW를 켤 수 있다 (?msw=시나리오). 운영 빌드에서는 이 import가 빠진다
const enableMsw = async () => {
  if (!import.meta.env.DEV) return;
  const { startMsw } = await import('@/msw/browser');
  await startMsw();
};

// MSW가 요청을 가로챌 준비를 마친 뒤에 앱을 그린다 (첫 요청부터 가짜 응답을 받게)
void enableMsw().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
