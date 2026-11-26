import type { ListStockRequest } from '@/apis/domains/stock/stock.types';
import type { StockFormErrors } from '@/apis/domains/stock/stock.validation';
import {
  STOCK_DESCRIPTION_MAX_LENGTH,
  STOCK_NAME_MAX_LENGTH,
  normalizeStockName,
} from '@/apis/domains/stock/stock.validation';
import { cn } from '@/utils/cn';
import StockAvatar from './StockAvatar';
import TextArea from '@/components/ui/TextArea';
import TextField from '@/components/ui/TextField';

interface StockListingFieldsProps {
  value: ListStockRequest;
  onChange: (value: ListStockRequest) => void;
  errors?: StockFormErrors;
}

// 상장 직후 모든 종목의 시초가 (서비스 정책 4.2)
const INITIAL_PRICE_LABEL = '10,000원';

// "나의 종목을 상장해 주세요." 미리보기 카드 + 종목 이름·소개 입력 (새 리그의 방장 상장, 종목 상장)
// 시안 '내 종목 상장 섹션': 미리보기·종목 이름·종목 소개 사이 16
function StockListingFields({ value, onChange, errors = {} }: StockListingFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 시안 '종목 미리보기 영역': Grey/3 테두리 상자(여백 12·8, 모서리 6) 안에 높이 54 카드(좌우 4, 사이 8)
          상자와 카드를 한 겹으로 합쳐 좌우 여백 12(8 + 4), 전체 높이 80 */}
      <div
        aria-label="상장 미리보기"
        className="box-content flex h-13.5 items-center gap-2 rounded-md border border-grey-3 bg-white px-3 py-3"
      >
        {/* 시안: 상장 전이라 NSSell 바탕. 입력 전에는 "종", 이름을 넣으면 첫 글자 */}
        <StockAvatar name={value.name} tone="preview" />
        {/* 이름 Title4, 소개 Body3, 사이 3. 입력 전에는 연하게(Grey/5·Grey/4), 입력하면 진하게(Grey/8·Grey/6) */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <p className={cn('truncate text-title4', value.name ? 'text-grey-8' : 'text-grey-5')}>
            {value.name || '종목 이름'}
          </p>
          <p
            className={cn('truncate text-body3', value.description ? 'text-grey-6' : 'text-grey-4')}
          >
            {value.description || '종목 소개'}
          </p>
        </div>
        {/* 시초가 Title2.5 Grey/8, 아래 4 띄우고 등락률 Body2.5 Grey/6 (폭 60, 오른쪽 정렬) */}
        <div className="flex min-w-15 shrink-0 flex-col items-end gap-1">
          <span className="text-title2-5 text-grey-8">{INITIAL_PRICE_LABEL}</span>
          <span className="text-body2-5 text-grey-6">0.0%</span>
        </div>
      </div>
      <TextField
        label="종목 이름"
        placeholder="종목 이름을 입력해 주세요."
        value={value.name}
        maxLength={STOCK_NAME_MAX_LENGTH}
        blockEmoji
        error={errors.name}
        onChange={(event) => onChange({ ...value, name: normalizeStockName(event.target.value) })}
      />
      <TextArea
        label="종목 소개"
        placeholder="종목 소개를 입력해 주세요."
        value={value.description}
        maxLength={STOCK_DESCRIPTION_MAX_LENGTH}
        error={errors.description}
        onChange={(event) => onChange({ ...value, description: event.target.value })}
      />
    </div>
  );
}

export default StockListingFields;
