import ButtonLink from './ButtonLink';

interface ErrorPageProps {
  /**
   * '메인 페이지로 이동'을 누를 때 함께 할 일
   * 메인이 같은 레이아웃 안이면 레이아웃이 다시 그려지지 않아 실패한 조회를 다시 하지 않으므로, 여기서 다시 조회한다
   */
  onMoveToMain?: () => void;
}

// [공통 오류] 페이지 (화면설계서 공통 7)
// 잘못된 주소, 서버 오류, 화면을 그리다 난 오류 등으로 페이지 전체를 보여줄 수 없을 때. 화면별 오류 안내가 있으면 그쪽을 쓴다
function ErrorPage({ onMoveToMain }: ErrorPageProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-9 text-center">
      <h1 className="text-lg font-bold">앗, 페이지를 불러올 수 없어요.</h1>
      <p className="text-sm text-gray-500">
        잠시 후 다시 시도하거나,
        <br />
        메인 페이지로 이동해 주세요.
      </p>
      <ButtonLink to="/leagues" replace variant="small" className="mt-6" onClick={onMoveToMain}>
        메인 페이지로 이동
      </ButtonLink>
    </main>
  );
}

export default ErrorPage;
