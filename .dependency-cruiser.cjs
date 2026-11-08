// 의존 규칙 검사: 순환 참조, 레이어 방향, 페이지·레이아웃 폴더 간 import
// 실행: pnpm check:deps

const ENTRY = '^src/(App|main)\\.tsx$';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: '파일 간 순환 참조 금지',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-barrel',
      comment: 'index 파일로 모아 re-export하지 않는다',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '/index\\.tsx?$', pathNot: '^node_modules/' },
    },
    {
      name: 'no-import-entry',
      comment: 'App.tsx는 main.tsx만 import하고, main.tsx는 누구도 import하지 않는다',
      severity: 'error',
      from: { path: '^src/', pathNot: '^src/main\\.tsx$' },
      to: { path: ENTRY },
    },

    // 레이어 방향: main → App → layouts → (pages | overlays) → components → hooks → stores → apis → libs → utils
    // overlays(주소 없는 작업형 화면)는 AppLayout이 그리고, 페이지는 overlayStore로 열기만 한다
    {
      name: 'utils-no-internal',
      comment: 'utils/는 프로젝트 내부를 import하지 않는다',
      severity: 'error',
      from: { path: '^src/utils/' },
      to: { path: '^src/', pathNot: '^src/utils/' },
    },
    {
      name: 'libs-only-utils',
      comment: 'libs/는 utils/만 import한다',
      severity: 'error',
      from: { path: '^src/libs/' },
      to: { path: '^src/', pathNot: '^src/(libs|utils)/' },
    },
    {
      name: 'apis-no-upper',
      comment: 'apis/는 libs/, utils/만 import한다',
      severity: 'error',
      from: { path: '^src/apis/' },
      to: { path: ['^src/(stores|hooks|components|layouts|pages|overlays)/', ENTRY] },
    },
    {
      name: 'stores-no-upper',
      severity: 'error',
      from: { path: '^src/stores/' },
      to: { path: ['^src/(hooks|components|layouts|pages|overlays)/', ENTRY] },
    },
    {
      name: 'stores-apis-type-only',
      comment: 'stores/는 apis/의 타입만 import한다',
      severity: 'error',
      from: { path: '^src/stores/' },
      to: { path: '^src/apis/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'hooks-no-upper',
      severity: 'error',
      from: { path: '^src/hooks/' },
      to: { path: ['^src/(components|layouts|pages|overlays)/', ENTRY] },
    },
    {
      name: 'components-no-upper',
      severity: 'error',
      from: { path: '^src/components/' },
      to: { path: ['^src/(layouts|pages|overlays)/', ENTRY] },
    },

    // overlays: 주소 없는 작업형 화면 (새 리그, 코드로 참여, 종목 상장, 주문, 공시 쓰기)
    {
      name: 'overlays-no-upper',
      comment: 'overlays는 layouts, pages를 import하지 않는다',
      severity: 'error',
      from: { path: '^src/overlays/' },
      to: { path: ['^src/(layouts|pages)/', ENTRY] },
    },
    {
      name: 'pages-not-overlays',
      comment:
        '페이지는 오버레이를 import하지 않고 overlayStore(hooks/useOverlay)로 연다. 그리는 곳은 AppLayout',
      severity: 'error',
      from: { path: '^src/pages/' },
      to: { path: '^src/overlays/' },
    },
    {
      name: 'no-cross-overlay',
      comment: '다른 오버레이 폴더를 import하지 않는다. 공유할 UI는 src/components/로 옮긴다',
      severity: 'error',
      from: { path: '^src/overlays/([^/]+)/' },
      to: { path: '^src/overlays/', pathNot: '^src/overlays/$1/' },
    },
    {
      name: 'overlay-components-not-overlay',
      comment: '오버레이 전용 컴포넌트는 자기 오버레이 파일을 import하지 않는다',
      severity: 'error',
      from: { path: '^src/overlays/([^/]+)/components/' },
      to: { path: '^src/overlays/$1/[^/]+$' },
    },

    // layouts, pages
    {
      name: 'layouts-not-pages',
      comment: 'layouts와 pages는 서로 import하지 않는다',
      severity: 'error',
      from: { path: '^src/layouts/' },
      to: { path: '^src/pages/' },
    },
    {
      name: 'pages-not-layouts',
      comment: 'layouts와 pages는 서로 import하지 않는다',
      severity: 'error',
      from: { path: '^src/pages/' },
      to: { path: '^src/layouts/' },
    },
    {
      name: 'no-cross-layout',
      comment: '다른 레이아웃 폴더를 import하지 않는다. 공유할 UI는 src/components/로 옮긴다',
      severity: 'error',
      from: { path: '^src/layouts/([^/]+)/' },
      to: { path: '^src/layouts/', pathNot: '^src/layouts/$1/' },
    },
    {
      name: 'no-cross-page',
      comment: '다른 페이지 폴더를 import하지 않는다. 공유할 UI는 src/components/로 옮긴다',
      severity: 'error',
      from: { path: '^src/pages/([^/]+)/' },
      to: { path: '^src/pages/', pathNot: '^src/pages/$1/' },
    },
    {
      name: 'layout-components-not-layout',
      comment: '레이아웃 전용 컴포넌트는 자기 레이아웃 파일을 import하지 않는다',
      severity: 'error',
      from: { path: '^src/layouts/([^/]+)/components/' },
      to: { path: '^src/layouts/$1/[^/]+$' },
    },
    {
      name: 'page-components-not-page',
      comment: '페이지 전용 컴포넌트는 자기 페이지 파일을 import하지 않는다',
      severity: 'error',
      from: { path: '^src/pages/([^/]+)/components/' },
      to: { path: '^src/pages/$1/[^/]+$' },
    },

    // apis 내부
    {
      name: 'apis-root-not-domains',
      comment: 'client.ts, socket.ts, types.ts는 domains/를 import하지 않는다',
      severity: 'error',
      from: { path: '^src/apis/[^/]+$' },
      to: { path: '^src/apis/domains/' },
    },
    {
      name: 'cross-domain-type-only',
      comment: '다른 도메인은 타입만 import한다 (import type)',
      severity: 'error',
      from: { path: '^src/apis/domains/([^/]+)/' },
      to: {
        path: '^src/apis/domains/',
        pathNot: '^src/apis/domains/$1/',
        dependencyTypesNot: ['type-only'],
      },
    },

    // mocks: API 준비 전 임시 데이터. service·socket만 바꾸면 실제 API로 전환되도록 사용처를 제한한다
    {
      name: 'mocks-only-from-service',
      comment: 'mocks/는 apis/domains의 service, socket 파일에서만 import한다',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: ['^src/mocks/', '^src/apis/domains/[^/]+/[^/]+\\.(service|socket)\\.ts$'],
      },
      to: { path: '^src/mocks/' },
    },
    {
      name: 'mocks-type-only',
      comment: 'mocks/는 프로젝트 내부에서 타입만 import한다',
      severity: 'error',
      from: { path: '^src/mocks/' },
      to: { path: '^src/', pathNot: '^src/mocks/', dependencyTypesNot: ['type-only'] },
    },

    {
      name: 'not-to-unresolvable',
      comment: '존재하지 않는 경로 import 금지',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // import type도 의존으로 잡아야 타입 전용 규칙과 타입 순환을 검사할 수 있다
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
  },
};
