import AdminAccountPage from '@travel-suite/frontend-shared/pages/admin/AdminAccountPage';
import { buildMetadata } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'My Account - Admin',
  description: 'Manage your admin account details.',
});

export default function Page() {
  return <AdminAccountPage />;
}
