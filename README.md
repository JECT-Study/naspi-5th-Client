# naspi-5th-Client

naspi 프론트엔드 레포지토리입니다.

## 기술 스택

- Vite 8 + React 19 + TypeScript
- Tailwind CSS v4
- React Router 8
- TanStack Query, axios
- Zustand
- lightweight-charts

## 시작하기

Node 24 (`.nvmrc`)와 pnpm이 필요합니다.

```bash
pnpm install
cp .env.example .env.local   # 환경 변수 채우기
pnpm dev
```

## 스크립트

| 명령어              | 설명                              |
| ------------------- | --------------------------------- |
| `pnpm dev`          | 개발 서버 실행                    |
| `pnpm build`        | 타입 체크 + 빌드                  |
| `pnpm preview`      | 빌드 결과물 미리보기              |
| `pnpm lint`         | ESLint 검사                       |
| `pnpm format`       | Prettier로 전체 포맷              |
| `pnpm format:check` | 포맷 검사 (수정 안 함)            |
| `pnpm check:deps`   | 순환 참조, 폴더 간 의존 규칙 검사 |

## 배포

Firebase Hosting에 GitHub Actions로 배포합니다.

- PR: lint, 포맷, 의존 규칙, 빌드 검사
- `main` 푸시: 검사 후 배포
