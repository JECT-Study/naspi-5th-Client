import ButtonLink from '@/components/ButtonLink';

// [공통 오류] 페이지 (화면설계서 공통 7)
// 잘못된 주소, 화면을 그리다 난 오류 등으로 페이지 전체를 보여줄 수 없을 때. 화면별 오류 안내가 있으면 그쪽을 쓴다
function ErrorPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-9 text-center">
      <h1 className="text-lg font-bold">앗, 페이지를 불러올 수 없어요.</h1>
      <p className="text-sm text-gray-500">
        잠시 후 다시 시도하거나,
        <br />
        메인 페이지로 이동해 주세요.
      </p>
      <ButtonLink to="/leagues" replace className="mt-6 w-full">
        메인 페이지로 이동
      </ButtonLink>
    </main>
  );
}

export default ErrorPage;
