import { useParams } from 'react-router';
import type { StockId } from '@/apis/domains/stock/stock.types';

// 종목 화면 주소(/leagues/:leagueId/stocks/:stockId/...)의 종목 id
export const useStockId = (): StockId => Number(useParams().stockId);
