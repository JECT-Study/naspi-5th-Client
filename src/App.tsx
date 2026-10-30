import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import AppLayout from '@/layouts/App/AppLayout';
import AuthLayout from '@/layouts/Auth/AuthLayout';
import RoomLayout from '@/layouts/Room/RoomLayout';
import RoomTabsLayout from '@/layouts/RoomTabs/RoomTabsLayout';
import AssetsPage from '@/pages/Assets/AssetsPage';
import DisclosureCreatePage from '@/pages/DisclosureCreate/DisclosureCreatePage';
import DisclosureDetailPage from '@/pages/DisclosureDetail/DisclosureDetailPage';
import FeedPage from '@/pages/Feed/FeedPage';
import LandingPage from '@/pages/Landing/LandingPage';
import LeagueCreatePage from '@/pages/LeagueCreate/LeagueCreatePage';
import LeagueJoinPage from '@/pages/LeagueJoin/LeagueJoinPage';
import LeagueListPage from '@/pages/LeagueList/LeagueListPage';
import LeagueResultPage from '@/pages/LeagueResult/LeagueResultPage';
import MarketPage from '@/pages/Market/MarketPage';
import NewsDetailPage from '@/pages/NewsDetail/NewsDetailPage';
import OrderHistoryPage from '@/pages/OrderHistory/OrderHistoryPage';
import ProfilePage from '@/pages/Profile/ProfilePage';
import RankingPage from '@/pages/Ranking/RankingPage';
import StockDetailPage from '@/pages/StockDetail/StockDetailPage';
import WaitingPage from '@/pages/Waiting/WaitingPage';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: '/leagues', element: <LeagueListPage /> },
          { path: '/leagues/new', element: <LeagueCreatePage /> },
          { path: '/join', element: <LeagueJoinPage /> },
          { path: '/profile', element: <ProfilePage /> },
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
              { path: 'stocks/:stockId', element: <StockDetailPage /> },
              { path: 'disclosures/new', element: <DisclosureCreatePage /> },
              { path: 'disclosures/:disclosureId', element: <DisclosureDetailPage /> },
              { path: 'news/:newsId', element: <NewsDetailPage /> },
              { path: 'orders', element: <OrderHistoryPage /> },
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
