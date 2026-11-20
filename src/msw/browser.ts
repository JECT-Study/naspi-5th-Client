import { setupWorker } from 'msw/browser';
import { createHandlers } from './handlers';
import { resolveScenario } from './scenario';

/**
 * 개발용 가짜 서버(MSW)를 켠다. 시나리오(?msw=)가 있을 때만 켠다 (scenario.ts)
 * 백엔드가 있어도 일부러 만들기 어려운 응답(가입 실패 등)을 화면에서 확인하려고 쓴다
 * 핸들러가 없는 요청(카카오 로그인 이동 등)은 그대로 실제 서버로 보낸다
 */
export const startMsw = async () => {
  const scenario = resolveScenario();
  if (!scenario) return;
  await setupWorker(...createHandlers(scenario)).start({
    // MSW 3: 처리하지 않는 요청은 실제 네트워크로 보낸다 (2버전의 onUnhandledRequest)
    onUnhandledFrame: 'bypass',
    quiet: true,
  });
  console.info(
    `[MSW] 시나리오: ${scenario} (새로고침하면 꺼진다. 계속 쓰려면 주소에 ?msw=${scenario})`,
  );
};
