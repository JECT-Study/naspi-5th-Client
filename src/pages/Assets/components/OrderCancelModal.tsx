import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetKeys } from '@/apis/domains/asset/asset.queries';
import { orderKeys } from '@/apis/domains/order/order.queries';
import { cancelOrder } from '@/apis/domains/order/order.service';
import type { OpenOrder, OrderErrorCode } from '@/apis/domains/order/order.types';
import type { RoomId } from '@/apis/domains/room/room.types';
import ConfirmModal from '@/components/ConfirmModal';
import { getApiErrorCode } from '@/libs/apiError';
import { notify } from '@/libs/notify';

interface OrderCancelModalProps {
  roomId: RoomId;
  order: OpenOrder;
  onClose: () => void;
}

// 주문을 취소할까요? (주문 유지 / 주문 취소) (내 자산 1-1)
// 일부 체결된 주문은 아직 체결되지 않은 수량만 취소된다 (서버가 처리)
// - 성공: 주문 취소 토스트(공통 5-4) 후 닫는다
// - 그 사이 전량 체결됨: 주문 취소 실패 토스트(공통 5-5) 후 닫는다 (취소할 수량이 더는 없으므로)
// - 그 밖의 실패: "주문 취소" 실패 토스트, 모달은 그대로 (X 없는 모달은 요청이 성공해야 닫힌다)
function OrderCancelModal({ roomId, order, onClose }: OrderCancelModalProps) {
  const queryClient = useQueryClient();
  const refreshOrders = () => {
    queryClient.invalidateQueries({ queryKey: assetKeys.room(roomId) });
    queryClient.invalidateQueries({ queryKey: orderKeys.room(roomId) });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => cancelOrder(roomId, order.orderId),
    onSuccess: () => {
      notify.success('주문을 취소했어요.');
      refreshOrders();
      onClose();
    },
    meta: {
      action: '주문 취소',
      handledErrors: ['ORDER_ALREADY_FILLED'] satisfies OrderErrorCode[],
    },
    onError: (error) => {
      if ((getApiErrorCode(error) as OrderErrorCode | undefined) === 'ORDER_ALREADY_FILLED') {
        notify.error('주문이 이미 체결되어 취소할 수 없어요.');
        refreshOrders();
        onClose();
      }
    },
  });

  return (
    <ConfirmModal
      title="주문을 취소할까요?"
      description="아직 체결되지 않은 수량만 취소해요."
      cancelLabel="주문 유지"
      confirmLabel="주문 취소"
      isPending={isPending}
      onConfirm={() => mutate()}
      onCancel={onClose}
    />
  );
}

export default OrderCancelModal;
