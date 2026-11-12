import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type ServerOptions } from 'vite';

// 로컬에서 개발 배포 주소(https://dev.naspi.my)를 그대로 쓰기 위한 설정
// hosts 파일로 dev.naspi.my를 내 PC(127.0.0.1)로 보내고, mkcert로 만든 인증서로 https 443에 띄운다
// 백엔드(dev.api.naspi.my)와 같은 site가 되어 세션 쿠키(SameSite=Lax)가 붙고, 로그인 후 이동 주소도 그대로 돌아온다
// 인증서가 없으면 기존처럼 http://localhost:5173으로 뜬다
const LOCAL_DOMAIN = 'dev.naspi.my';
const certFile = (name: string) => fileURLToPath(new URL(`./.cert/${name}`, import.meta.url));
const certPath = certFile(`${LOCAL_DOMAIN}.pem`);
const keyPath = certFile(`${LOCAL_DOMAIN}-key.pem`);

const localDomainServer: ServerOptions | undefined =
  existsSync(certPath) && existsSync(keyPath)
    ? {
        https: { cert: readFileSync(certPath), key: readFileSync(keyPath) },
        // hosts가 IPv4(127.0.0.1)로 보내므로 IPv6(::1)로만 열리지 않게 고정한다
        host: '127.0.0.1',
        // 로그인 후 백엔드가 https://dev.naspi.my(기본 포트 443)로 돌려보내므로 443이어야 한다
        port: 443,
        strictPort: true,
        allowedHosts: [LOCAL_DOMAIN],
      }
    : undefined;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: localDomainServer,
});
