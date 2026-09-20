'use client';

import InsuranceQuotePage from '@travel-suite/frontend-shared/pages/client/InsuranceQuotePage';
import { trackViewItemList, trackSelectItem } from '@travel-suite/frontend-shared/utils/analytics';

export default function Page() {
  return (
    <InsuranceQuotePage
      onViewItemList={trackViewItemList}
      onSelectItem={trackSelectItem}
    />
  );
}
