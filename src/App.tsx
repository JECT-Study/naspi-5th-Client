import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import AppFrame from '@/layouts/App/AppFrame';
import AppLayout from '@/layouts/App/AppLayout';
import AuthLayout from '@/layouts/Auth/AuthLayout';
import RoomLayout from '@/layouts/Room/RoomLayout';
import RoomTabsLayout from '@/layouts/RoomTabs/RoomTabsLayout';
import StockLayout from '@/layouts/Stock/StockLayout';
import AssetsPage from '@/pages/Assets/AssetsPage';
import DisclosureDetailPage from '@/pages/DisclosureDetail/DisclosureDetailPage';
import ErrorPage from '@/pages/Error/ErrorPage';
import FeedPage from '@/pages/Feed/FeedPage';
import LandingPage from '@/pages/Landing/LandingPage';
import LeagueListPage from '@/pages/LeagueList/LeagueListPage';
import LeagueResultPage from '@/pages/LeagueResult/LeagueResultPage';
import MarketPage from '@/pages/Market/MarketPage';
import NewsDetailPage from '@/pages/NewsDetail/NewsDetailPage';
import OrderHistoryPage from '@/pages/OrderHistory/OrderHistoryPage';
import RankingPage from '@/pages/Ranking/RankingPage';
import StockChartPage from '@/pages/StockChart/StockChartPage';
import StockInfoPage from '@/pages/StockInfo/StockInfoPage';
import StockMinePage from '@/pages/StockMine/StockMinePage';
import WaitingPage from '@/pages/Waiting/WaitingPage';

// 작업형 화면(새 리그, 코드로 참여, 종목 상장, 주문, 공시 쓰기)은 주소가 없는 오버레이라 여기 없다 (src/overlays/)
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    // 화면을 그리다 난 오류는 앱 틀 안에 공통 오류 페이지로 보여준다
    errorElement: (
      <AppFrame>
        <ErrorPage />
      </AppFrame>
    ),
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '*', element: <ErrorPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: '/leagues', element: <LeagueListPage /> },
          {
            path: '/leagues/:leagueId',
            element: <RoomLayout />,
            children: [
              {
                element: <RoomTabsLayout />,
                children: [
                  { index: true, element: <FeedPage /> },
                  { path: 'market', element: <MarketPage /> },
                  { path: 'assets', element: <AssetsPage /> },
                  { path: 'ranking', element: <RankingPage /> },
                ],
              },
              { path: 'waiting', element: <WaitingPage /> },
              {
                path: 'stocks/:stockId',
                element: <StockLayout />,
                children: [
                  { index: true, element: <StockChartPage /> },
                  { path: 'info', element: <StockInfoPage /> },
                  { path: 'mine', element: <StockMinePage /> },
                ],
              },
              { path: 'orders', element: <OrderHistoryPage /> },
              { path: 'disclosures/:disclosureId', element: <DisclosureDetailPage /> },
              { path: 'news/:newsId', element: <NewsDetailPage /> },
              { path: 'result', element: <LeagueResultPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
