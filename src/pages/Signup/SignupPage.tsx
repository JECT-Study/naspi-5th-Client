import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { signup } from '@/apis/domains/auth/auth.service';
import type { SignupErrorCode } from '@/apis/domains/auth/auth.types';
import { userKeys, userQueries } from '@/apis/domains/user/user.queries';
import { INVALID_NAME_MESSAGE } from '@/apis/domains/user/user.validation';
import NameFormModal from '@/components/NameFormModal';
import { getApiErrorCode } from '@/libs/apiError';
import { clearLoginReturnPath, readLoginReturnPath } from '@/libs/loginReturnPath';

// 가입 대기 정보 없음(100), 이미 가입함(102): 카카오 로그인부터 다시 (API 문서). 로그인 실패 안내로 보낸다
const RESTART_LOGIN_CODES: SignupErrorCode[] = ['100', '102'];

// 이름 입력 회원가입 (공통 3 이름 입력 모달)
// 카카오 이름에 한글이 없는 신규 회원을 백엔드가 카카오 로그인 직후 여기로 보낸다 (가입 대기 세션 10분)
// 이름을 입력하면 가입되고 로그인된다 → 돌아갈 주소(없으면 메인)로 간다
function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // 이미 로그인된 회원이 주소로 들어온 경우를 거른다. 가입 대기 중이면 회원이 아니라서 401이다
  const me = useQuery(userQueries.me());

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      // 가입하면 로그인된다. 로그인 확인 결과(401)를 버려서 다음 화면이 새로 확인하게 한다
      queryClient.removeQueries({ queryKey: userKeys.me() });
      navigate(readLoginReturnPath() ?? '/leagues', { replace: true });
      clearLoginReturnPath();
    },
    // 101은 입력칸 아래, 100·102는 로그인 실패 안내, 그 밖은 "저장 중 문제가 발생했어요." 토스트 (공통 3, 5-1)
    meta: { action: '저장', handledErrors: ['101', ...RESTART_LOGIN_CODES] },
    onError: (mutationError) => {
      const code = getApiErrorCode(mutationError) as SignupErrorCode | undefined;
      if (code && RESTART_LOGIN_CODES.includes(code)) navigate('/login-failure', { replace: true });
    },
  });

  if (me.isSuccess) return <Navigate to={readLoginReturnPath() ?? '/leagues'} replace />;

  // 서버가 이름 규칙 위반(101)으로 거절해도 같은 문자 오류메세지(공통 1-2-1)를 보여준다
  const isInvalidName = getApiErrorCode(error) === '101';

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {me.isError && (
        <NameFormModal
          title="이름을 입력해 주세요."
          isPending={isPending}
          serverError={isInvalidName ? INVALID_NAME_MESSAGE : undefined}
          onChange={reset}
          onSubmit={(name) => mutate({ name })}
        />
      )}
    </main>
  );
}

export default SignupPage;
