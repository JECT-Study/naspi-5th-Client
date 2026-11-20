import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Toaster as SonnerToaster } from 'sonner';
import { setToastRenderer, type ToastContent, type ToastType } from '@/libs/notify';
import { AlertCircleIcon, CheckBoxFilledIcon, SpeakerIcon } from '@/components/ui/icons';

/** 화면설계서 공통: 2초 표시 후 자동으로 닫힘 */
const TOAST_DURATION_MS = 2000;
/** 시안 토스트 폭 */
const TOAST_WIDTH = 320;
/** 화면 위에서 토스트까지 거리 (시안에 없음, 기존 값) */
const TOAST_TOP = 16;

// 시안 Toast: 성공 CheckBox 24, 오류 Notice 24, 새 거래일 speaker 24 (모두 흰색)
function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return <CheckBoxFilledIcon />;
  if (type === 'error') return <AlertCircleIcon />;
  return <SpeakerIcon />;
}

// 시안 Toast (160:8644): 폭 320, 모서리 8, Grey/6 바탕, 여백 14·17, 아이콘 24 + 간격 4 + Button2.5 흰 글자(2줄까지)
// 링크("확인하기")는 오른쪽 Button2.5 NSBlue(Light)
function ToastView({ content, close }: { content: ToastContent; close: () => void }) {
  return (
    <div className="flex w-80 items-center gap-1 rounded-lg bg-grey-6 px-4.25 py-3.5 text-button2-5 text-white">
      <ToastIcon type={content.type} />
      <p className="line-clamp-2 min-w-0 flex-1">{content.message}</p>
      {content.link && (
        <Link to={content.link.to} className="shrink-0 text-ns-blue-light" onClick={close}>
          {content.link.label}
        </Link>
      )}
    </div>
  );
}

// 이 파일을 불러올 때 바로 등록한다. 화면이 처음 그려지며 띄우는 토스트도 놓치지 않게 (useEffect는 자식보다 늦게 돈다)
setToastRenderer((content, close) => <ToastView content={content} close={close} />);

// 휴대폰 폭(600 이하)에서 sonner는 토스트를 화면 폭에 맞춰 늘린다. 좌우 여백을 (화면 - 320) / 2로 줘서 시안 폭 320을 지킨다
const SIDE_OFFSET = `calc(50% - ${TOAST_WIDTH / 2}px)`;

// notify.success / error / announce로 띄운 알림을 화면 위쪽 가운데에 보여준다. AppLayout에 한 번만 둔다
// 애니메이션·쌓임·밀어서 닫기는 sonner 기본 동작을 쓴다. 한 번에 3개까지 보인다
function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      duration={TOAST_DURATION_MS}
      visibleToasts={3}
      offset={{ top: TOAST_TOP }}
      mobileOffset={{ top: TOAST_TOP, left: SIDE_OFFSET, right: SIDE_OFFSET }}
      containerAriaLabel="알림"
      // 글꼴은 앱 글꼴을 따른다 (sonner 기본은 시스템 글꼴)
      style={{ '--width': `${TOAST_WIDTH}px`, fontFamily: 'inherit' } as CSSProperties}
    />
  );
}

export default Toaster;
