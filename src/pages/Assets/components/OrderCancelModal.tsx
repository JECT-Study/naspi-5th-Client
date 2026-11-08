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

// 주문을 취소할까요? (그만두기 / 취소하기) (내 자산 1-1)
// - 성공: 주문 취소 토스트(공통 5-4) 후 닫는다
// - 그 사이 체결됨: 주문 취소 실패 토스트(공통 5-5) 후 닫는다 (취소할 주문이 더는 없으므로)
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
      description={`${order.stockName} 대기 중인 주문을 취소할게요.`}
      cancelLabel="그만두기"
      confirmLabel="취소하기"
      isPending={isPending}
      onConfirm={() => mutate()}
      onCancel={onClose}
    />
  );
}

export default OrderCancelModal;
