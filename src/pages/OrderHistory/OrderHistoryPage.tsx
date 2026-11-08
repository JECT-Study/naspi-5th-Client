import PageHeader from '@/components/PageHeader';
import { useRoomId } from '@/hooks/useRoomId';

// 주문 내역 (Depth 3, 화면설계서 공통 4-3 적용 페이지)
// TODO: 화면설계서에 주문 내역 화면이 생기면 채운다
function OrderHistoryPage() {
  const roomId = useRoomId();

  return (
    <>
      <PageHeader title="주문 내역" fallbackTo={`/leagues/${roomId}/assets`} />
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-9 py-6">
        <p className="text-sm text-gray-500">주문 내역 화면은 준비 중이에요.</p>
      </main>
    </>
  );
}

export default OrderHistoryPage;
