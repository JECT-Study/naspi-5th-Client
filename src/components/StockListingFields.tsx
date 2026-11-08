import type { ListStockRequest } from '@/apis/domains/stock/stock.types';
import type { StockFormErrors } from '@/apis/domains/stock/stock.validation';
import {
  STOCK_DESCRIPTION_COUNTER_FROM,
  STOCK_DESCRIPTION_MAX_LENGTH,
  normalizeStockName,
} from '@/apis/domains/stock/stock.validation';
import { cn } from '@/utils/cn';
import StockAvatar from './StockAvatar';
import TextArea from './TextArea';
import TextField from './TextField';

interface StockListingFieldsProps {
  value: ListStockRequest;
  onChange: (value: ListStockRequest) => void;
  errors?: StockFormErrors;
}

// 상장 직후 모든 종목의 시초가 (서비스 정책 4.2)
const INITIAL_PRICE_LABEL = '10,000원';

// "나의 종목을 상장해 주세요." 미리보기 카드 + 종목 이름·소개 입력 (새 리그의 방장 상장, 종목 상장)
function StockListingFields({ value, onChange, errors = {} }: StockListingFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3" aria-label="상장 미리보기">
        <StockAvatar name={value.name || '종목'} />
        <div className="min-w-0 flex-1">
          <p className={cn('truncate font-bold', !value.name && 'text-gray-400')}>
            {value.name || '종목 이름'}
          </p>
          <p
            className={cn('truncate text-sm text-gray-500', !value.description && 'text-gray-400')}
          >
            {value.description || '종목 소개'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="font-bold text-gray-500">0.0%</span>
          <span className="text-sm">{INITIAL_PRICE_LABEL}</span>
        </div>
      </div>
      <TextField
        label="종목 이름"
        placeholder="종목 이름을 입력해 주세요."
        value={value.name}
        error={errors.name}
        onChange={(event) => onChange({ ...value, name: normalizeStockName(event.target.value) })}
      />
      <TextArea
        label="종목 소개"
        placeholder="종목 소개를 입력해 주세요."
        value={value.description}
        maxLength={STOCK_DESCRIPTION_MAX_LENGTH}
        counterFrom={STOCK_DESCRIPTION_COUNTER_FROM}
        error={errors.description}
        onChange={(event) => onChange({ ...value, description: event.target.value })}
      />
    </div>
  );
}

export default StockListingFields;
