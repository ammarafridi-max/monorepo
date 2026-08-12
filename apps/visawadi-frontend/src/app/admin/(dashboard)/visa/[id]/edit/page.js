'use client';

import AdminEditVisaPage from '@travel-suite/frontend-shared/pages/admin/AdminEditVisaPage';
import { COUNTRIES } from '@/config/countries';
import { SITE_URL } from '@/lib/schema';

// Every configured country, not just the live ones — overlays have to be
// written and reviewed before a country is switched on.
export default function Page() {
  return <AdminEditVisaPage countries={COUNTRIES} siteUrl={SITE_URL} />;
}
