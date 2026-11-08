import { useEffect, useRef } from 'react';
import Modal from './Modal';

interface NoticeModalProps {
  title: string;
  /** 1초 뒤 모달이 사라질 때 (정해진 위치로 이동 등) */
  onDone: () => void;
}

const NOTICE_DURATION_MS = 1000;

// X 버튼과 내부 버튼이 모두 없는 안내 모달: 1초간 보여준 뒤 사라진다 (화면설계서 공통)
function NoticeModal({ title, onDone }: NoticeModalProps) {
  // 부모가 다시 그려져 onDone이 바뀌어도 타이머를 새로 걸지 않는다
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const timer = setTimeout(() => onDoneRef.current(), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <Modal title={title} />;
}

export default NoticeModal;
