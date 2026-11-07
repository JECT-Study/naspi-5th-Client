import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import AppLayout from '@/layouts/App/AppLayout';
import AuthLayout from '@/layouts/Auth/AuthLayout';
import RoomLayout from '@/layouts/Room/RoomLayout';
import RoomTabsLayout from '@/layouts/RoomTabs/RoomTabsLayout';
import StockLayout from '@/layouts/Stock/StockLayout';
import AssetsPage from '@/pages/Assets/AssetsPage';
import DisclosureCreatePage from '@/pages/DisclosureCreate/DisclosureCreatePage';
import DisclosureDetailPage from '@/pages/DisclosureDetail/DisclosureDetailPage';
import ErrorPage from '@/pages/Error/ErrorPage';
import FeedPage from '@/pages/Feed/FeedPage';
import LandingPage from '@/pages/Landing/LandingPage';
import LeagueCreatePage from '@/pages/LeagueCreate/LeagueCreatePage';
import LeagueJoinPage from '@/pages/LeagueJoin/LeagueJoinPage';
import LeagueListPage from '@/pages/LeagueList/LeagueListPage';
import LeagueResultPage from '@/pages/LeagueResult/LeagueResultPage';
import MarketPage from '@/pages/Market/MarketPage';
import NewsDetailPage from '@/pages/NewsDetail/NewsDetailPage';
import OrderPage from '@/pages/Order/OrderPage';
import RankingPage from '@/pages/Ranking/RankingPage';
import StockChartPage from '@/pages/StockChart/StockChartPage';
import StockInfoPage from '@/pages/StockInfo/StockInfoPage';
import StockListingPage from '@/pages/StockListing/StockListingPage';
import WaitingPage from '@/pages/Waiting/WaitingPage';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '*', element: <ErrorPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: '/leagues', element: <LeagueListPage /> },
          { path: '/leagues/new', element: <LeagueCreatePage /> },
          { path: '/join', element: <LeagueJoinPage /> },
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
              { path: 'listing', element: <StockListingPage /> },
              {
                path: 'stocks/:stockId',
                element: <StockLayout />,
                children: [
                  { index: true, element: <StockChartPage /> },
                  { path: 'info', element: <StockInfoPage /> },
                ],
              },
              { path: 'stocks/:stockId/buy', element: <OrderPage side="BUY" /> },
              { path: 'stocks/:stockId/sell', element: <OrderPage side="SELL" /> },
              { path: 'disclosures/new', element: <DisclosureCreatePage /> },
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
