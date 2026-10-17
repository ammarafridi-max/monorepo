'use client';

import AdminEditVisaPage from '@travel-suite/frontend-shared/pages/admin/AdminEditVisaPage';
import { COUNTRIES } from '@/config/countries';
import { SITE_URL } from '@/lib/schema';

export default function Page() {
  return <AdminEditVisaPage countries={COUNTRIES} siteUrl={SITE_URL} />;
}
