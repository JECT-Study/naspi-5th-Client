import { useId, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roomKeys } from '@/apis/domains/room/room.queries';
import { updateRoomName } from '@/apis/domains/room/room.service';
import type { RoomId } from '@/apis/domains/room/room.types';
import { ROOM_NAME_MAX_LENGTH } from '@/apis/domains/room/room.validation';
import ConfirmModal from '@/components/ConfirmModal';
import TextField from '@/components/TextField';

interface RoomNameEditModalProps {
  roomId: RoomId;
  currentName: string;
  onClose: () => void;
}

// 리그 이름 수정 (방장): 공란이면 확인 비활성화, 저장 실패 시 입력값을 그대로 두고 모달 유지
function RoomNameEditModal({ roomId, currentName, onClose }: RoomNameEditModalProps) {
  const queryClient = useQueryClient();
  const formId = useId();
  const [name, setName] = useState(currentName);

  const { mutate, isPending } = useMutation({
    mutationFn: (nextName: string) => updateRoomName(roomId, { name: nextName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      queryClient.invalidateQueries({ queryKey: roomKeys.mine() });
      onClose();
    },
    meta: { action: '저장' },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutate(name.trim());
  };

  return (
    <ConfirmModal
      title="리그 이름을 수정해 주세요."
      confirmLabel="확인"
      formId={formId}
      confirmDisabled={name.trim() === ''}
      isPending={isPending}
      onCancel={onClose}
    >
      <form id={formId} onSubmit={handleSubmit}>
        <TextField
          aria-label="리그 이름"
          placeholder="리그 이름을 입력해 주세요."
          value={name}
          maxLength={ROOM_NAME_MAX_LENGTH}
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      </form>
    </ConfirmModal>
  );
}

export default RoomNameEditModal;
