type OrderPageProps = {
  side: 'BUY' | 'SELL';
};

// 구매하기(/buy)와 판매하기(/sell)가 같이 쓰는 주문 화면. 매수·매도는 경로로 정해져 들어온다
function OrderPage({ side }: OrderPageProps) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-4">
      <h1 className="text-lg font-bold">{side === 'BUY' ? '구매하기' : '판매하기'}</h1>
    </main>
  );
}

export default OrderPage;
