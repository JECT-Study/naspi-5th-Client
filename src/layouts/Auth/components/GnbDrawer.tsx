import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { getActiveRooms } from '@/apis/domains/room/room.utils';
import { userQueries } from '@/apis/domains/user/user.queries';
import Badge from '@/components/ui/Badge';
import { HEADER_CLASS, HEADER_ICON_BUTTON_CLASS } from '@/components/header/headerStyles';
import { ChevronRightIcon, CloseIcon, LogoutIcon } from '@/components/ui/icons';
import LoadError from '@/components/status/LoadError';
import { useMyRooms } from '@/hooks/useMyRooms';
import { useOpenLeagueEntry } from '@/hooks/useOpenLeagueEntry';
import { useGnbDrawerStore } from '@/stores/gnbDrawerStore';
import { cn } from '@/utils/cn';
import { formatDday, getDaysUntil } from '@/utils/date';
import MyNameField from './MyNameField';

// TODO: 노션 약관 페이지 주소를 전달받으면 채운다
// 약관(또는 오픈소스 라이선스) 페이지에 차트 라이브러리 저작권 문구를 꼭 넣는다 (Apache 2.0 NOTICE)
//   "TradingView Lightweight Charts™ Copyright (с) TradingView, Inc. https://www.tradingview.com/"
const TERMS_LINKS = [
  { label: '서비스 이용약관', href: undefined },
  { label: '개인정보 처리방침', href: undefined },
];

// 오른쪽에서 열리는 전역 메뉴 (화면설계서 공통 1). 열려 있을 때만 렌더링되므로 내 정보·나의 리그도 이때 조회한다
// 안의 클릭 가능한 요소를 누르면 드로어는 닫힌다. 모달(로그아웃, 탈퇴)은 AuthLayout이 띄운다
// 예외: 이름 수정(수정·취소·저장)은 드로어 안에서 하고, 조회 실패의 '다시 시도'는 결과를 봐야 하므로 닫지 않는다
// 열릴 때 오른쪽에서 밀려 들어오고 뒤 배경이 서서히 어두워진다. 닫을 때는 반대로 한 뒤(0.25초) 스토어에서 닫는다
// (시안에 없는 움직임이라 바텀시트와 같은 시간으로 둔다. 모션 줄이기 설정이면 움직이지 않는다)
const EXIT_MS = 250;

// 시안 메뉴 줄 (나의 리그, 새 리그 만들기, 코드로 참여): 높이 48, 위아래 4, 왼쪽 16, Title2 (색은 줄마다)
const MENU_ROW_CLASS = 'flex h-12 items-center justify-between py-1 pl-4 text-title2 text-grey-8';
// 시안 아래쪽 줄 (약관, 로그아웃, 회원 탈퇴): 높이 32, 좌우 16, Body2 Grey/5
const FOOTER_ROW_CLASS = 'flex h-8 items-center px-4 text-body2 text-grey-5';

// 메뉴 줄 오른쪽 꺾쇠: 34 영역(여백 8) 안에 Right 18 Grey/8
function MenuChevron() {
  return (
    <span className="flex size-8.5 shrink-0 items-center justify-center">
      <ChevronRightIcon className="text-grey-8" />
    </span>
  );
}

function GnbDrawer() {
  const closeGnbDrawer = useGnbDrawerStore((state) => state.closeGnbDrawer);
  const openGnbModal = useGnbDrawerStore((state) => state.openGnbModal);
  const me = useQuery(userQueries.me());
  const myRooms = useMyRooms();
  const isError = me.isError || myRooms.isError;
  // 새 리그 만들기·코드로 참여는 지금 화면 위에 오버레이로 연다 (리그 5개면 제한 토스트)
  const openLeagueEntry = useOpenLeagueEntry();
  const [isClosing, setIsClosing] = useState(false);
  const close = () => setIsClosing(true);

  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(closeGnbDrawer, EXIT_MS);
    return () => clearTimeout(timer);
  }, [isClosing, closeGnbDrawer]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsClosing(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRetry = () => {
    if (me.isError) me.refetch();
    if (myRooms.isError) myRooms.refetch();
  };

  const rooms = myRooms.data ? getActiveRooms(myRooms.data) : [];

  return (
    <div className="absolute inset-0 z-40 overflow-hidden">
      {/* 뒤 배경은 드로어 뒤까지 화면 전체에 깐다. 드로어 왼쪽만 덮으면 미끄러져 들어오는 동안 어두운 경계가 보인다 */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        className={cn(
          'absolute inset-0 animate-fade-in bg-dim/40 transition-opacity duration-250 motion-reduce:animate-none motion-reduce:transition-none',
          isClosing && 'opacity-0',
        )}
        onClick={close}
      />
      {/* 시안 GNB드로어: 폭 278, 흰색, 오른쪽에 붙음. 상단바와 본문 사이 8 */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
        className={cn(
          'absolute inset-y-0 right-0 flex w-69.5 animate-drawer-in flex-col gap-2 overflow-y-auto bg-white transition-transform duration-250 motion-reduce:animate-none motion-reduce:transition-none',
          isClosing && 'translate-x-full',
        )}
      >
        {/* 시안 드로어 상단바: 높이 50, 여백 3·7. 로고 영역 95(글자는 안쪽 12) + 닫기(44 영역, 얇은 X 24) */}
        <header className={cn(HEADER_CLASS, 'justify-between px-1.75')}>
          <div className="flex h-11 w-23.75 items-center pl-3">
            <span className="font-bold text-grey-8">로고</span>
          </div>
          <button
            type="button"
            aria-label="메뉴 닫기"
            className={HEADER_ICON_BUTTON_CLASS}
            onClick={close}
          >
            <CloseIcon className="text-grey-8" />
          </button>
        </header>
        {/* 시안 '드로어 본문 영역': 위(내 계정·나의 리그·리그 메뉴)와 아래(약관·계정 관리)를 양 끝에 붙인다 */}
        <div className="flex flex-1 flex-col justify-between gap-2">
          {/* 조회 실패 (공통 1-1): 내 계정·나의 리그·리그 메뉴 대신 오류와 다시 시도만 보여준다 (여백 20·24) */}
          {isError ? (
            <LoadError onRetry={handleRetry} className="px-6 py-5" />
          ) : (
            <div className="flex flex-col gap-2">
              <MyNameField name={me.data?.name} />

              {/* 시안 '나의 리그 메뉴 목록': 좌우 6, 줄 높이 48 */}
              <section className="flex flex-col px-1.5">
                <Link to="/leagues" className={MENU_ROW_CLASS} onClick={close}>
                  나의 리그
                  <MenuChevron />
                </Link>
                {myRooms.isPending &&
                  [0, 1].map((key) => (
                    <div key={key} className="flex h-12 items-center pl-9">
                      <div className="h-5.5 w-32 animate-pulse rounded-md bg-grey-0" />
                    </div>
                  ))}
                {/* 진행 중·대기 중 리그만, 시작(대기실 생성)이 이른 순. 없으면 목록을 숨긴다 */}
                {rooms.length > 0 && (
                  <ul className="flex flex-col">
                    {rooms.map((room) => (
                      <li key={room.roomId}>
                        {/* 시안 List_League: 높이 48, 왼쪽 36, 리그명 Title2.5 Grey/6, 배지까지 8 */}
                        <Link
                          to={
                            room.status === 'WAITING'
                              ? `/leagues/${room.roomId}/waiting`
                              : `/leagues/${room.roomId}`
                          }
                          className="flex h-12 items-center gap-2 pl-9"
                          onClick={close}
                        >
                          <span className="min-w-0 truncate text-title2-5 text-grey-6">
                            {room.name}
                          </span>
                          {/* 진행 중이면 D-day, 대기실이면 '대기' (공통 1) */}
                          {room.endAt ? (
                            <Badge>{formatDday(getDaysUntil(new Date(room.endAt)))}</Badge>
                          ) : (
                            <Badge tone="waiting">대기</Badge>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* 시안 '리그 생성 및 참여 메뉴': 새 리그 만들기만 NSBlue */}
              <nav className="flex flex-col px-1.5">
                {(
                  [
                    ['leagueCreate', '새 리그 만들기', 'text-ns-blue'],
                    ['leagueJoin', '코드로 참여', 'text-grey-8'],
                  ] as const
                ).map(([type, label, color]) => (
                  <button
                    key={type}
                    type="button"
                    className={cn(MENU_ROW_CLASS, 'text-left', color)}
                    onClick={() => {
                      close();
                      openLeagueEntry(type);
                    }}
                  >
                    {label}
                    <MenuChevron />
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* 시안 '약관 및 계정 관리 영역': 위아래 24, 묶음 사이 16, 묶음 왼쪽 6, 줄 높이 32, Body2 Grey/5 */}
          <div className="flex flex-col gap-4 py-6">
            <div className="flex flex-col pl-1.5">
              {TERMS_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={FOOTER_ROW_CLASS}
                  onClick={close}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col pl-1.5">
              {/* 로그아웃만 아이콘(SignOut 24)이 있어 왼쪽 10, 아이콘과 글자 사이 2 */}
              <button
                type="button"
                className={cn(FOOTER_ROW_CLASS, 'gap-0.5 px-2.5')}
                onClick={() => {
                  openGnbModal('logout');
                  close();
                }}
              >
                <LogoutIcon />
                로그아웃
              </button>
              <button
                type="button"
                className={FOOTER_ROW_CLASS}
                onClick={() => {
                  openGnbModal('withdraw');
                  close();
                }}
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default GnbDrawer;
