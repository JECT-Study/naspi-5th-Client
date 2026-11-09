import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { getActiveRooms } from '@/apis/domains/room/room.utils';
import { userQueries } from '@/apis/domains/user/user.queries';
import { ChevronRightIcon, CloseIcon, LogoutIcon } from '@/components/icons';
import { useMyRooms } from '@/hooks/useMyRooms';
import { useOpenLeagueEntry } from '@/hooks/useOpenLeagueEntry';
import { useGnbDrawerStore } from '@/stores/gnbDrawerStore';
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
function GnbDrawer() {
  const closeGnbDrawer = useGnbDrawerStore((state) => state.closeGnbDrawer);
  const openGnbModal = useGnbDrawerStore((state) => state.openGnbModal);
  const me = useQuery(userQueries.me());
  const myRooms = useMyRooms();
  const isError = me.isError || myRooms.isError;
  // 새 리그 만들기·코드로 참여는 지금 화면 위에 오버레이로 연다 (리그 5개면 제한 토스트)
  const openLeagueEntry = useOpenLeagueEntry();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGnbDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeGnbDrawer]);

  const handleRetry = () => {
    if (me.isError) me.refetch();
    if (myRooms.isError) myRooms.refetch();
  };

  const rooms = myRooms.data ? getActiveRooms(myRooms.data) : [];

  return (
    <div className="absolute inset-0 z-40 flex">
      <button
        type="button"
        aria-label="메뉴 닫기"
        className="flex-1 bg-black/40"
        onClick={closeGnbDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
        className="flex w-74 flex-col overflow-y-auto bg-white px-6 pb-8"
      >
        <header className="flex items-center justify-between py-5">
          <span className="font-bold">로고</span>
          <button type="button" aria-label="메뉴 닫기" onClick={closeGnbDrawer}>
            <CloseIcon />
          </button>
        </header>

        {/* 조회 실패 (공통 1-1): 내 계정·나의 리그·리그 메뉴 대신 오류와 다시 시도만 보여준다 */}
        {isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm">
            <span>정보를 불러오지 못했어요.</span>
            <button type="button" className="text-xs underline" onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        ) : (
          <>
            <section className="border-b pb-4">
              <p className="text-sm text-gray-500">내 계정</p>
              {me.isPending ? (
                // 처음 불러오는 동안 스켈레톤 (공통 화면 정책: 로딩 표시)
                <div className="mt-1 h-7 w-24 animate-pulse rounded bg-gray-100" />
              ) : (
                <MyNameField name={me.data?.name} />
              )}
            </section>

            <section className="border-b py-4">
              <Link
                to="/leagues"
                className="flex items-center justify-between font-bold"
                onClick={closeGnbDrawer}
              >
                나의 리그
                <ChevronRightIcon />
              </Link>
              {myRooms.isPending && (
                <div className="mt-2 flex flex-col gap-2 pl-4">
                  {[0, 1].map((key) => (
                    <div key={key} className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              )}
              {/* 진행 중·대기 중 리그만, 시작(대기실 생성)이 이른 순. 없으면 목록을 숨긴다 */}
              {rooms.length > 0 && (
                <ul className="mt-2 flex flex-col">
                  {rooms.map((room) => (
                    <li key={room.roomId}>
                      <Link
                        to={
                          room.status === 'WAITING'
                            ? `/leagues/${room.roomId}/waiting`
                            : `/leagues/${room.roomId}`
                        }
                        className="flex items-center gap-2 py-1.5 pl-4"
                        onClick={closeGnbDrawer}
                      >
                        <span className="min-w-0 truncate">{room.name}</span>
                        {/* 진행 중이면 D-day, 대기실이면 '대기' (공통 1) */}
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 text-xs">
                          {room.endAt ? formatDday(getDaysUntil(new Date(room.endAt))) : '대기'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <nav className="flex flex-col border-b py-2">
              {(
                [
                  ['leagueCreate', '새 리그 만들기'],
                  ['leagueJoin', '코드로 참여'],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  className="flex items-center justify-between py-2 text-left font-bold"
                  onClick={() => {
                    closeGnbDrawer();
                    openLeagueEntry(type);
                  }}
                >
                  {label}
                  <ChevronRightIcon />
                </button>
              ))}
            </nav>
          </>
        )}

        <div className="mt-auto flex flex-col gap-1 border-b pb-4 text-sm">
          {TERMS_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-1"
              onClick={closeGnbDrawer}
            >
              {link.label}
              <ChevronRightIcon />
            </a>
          ))}
        </div>

        <div className="flex flex-col items-start gap-3 pt-4">
          <button
            type="button"
            className="flex items-center gap-2 font-bold"
            onClick={() => openGnbModal('logout')}
          >
            <LogoutIcon />
            로그아웃
          </button>
          <button
            type="button"
            className="text-sm text-gray-500"
            onClick={() => openGnbModal('withdraw')}
          >
            회원 탈퇴
          </button>
        </div>
      </aside>
    </div>
  );
}

export default GnbDrawer;
