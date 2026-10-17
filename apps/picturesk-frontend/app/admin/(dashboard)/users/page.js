import AdminUsersPage from '@travel-suite/frontend-shared/pages/admin/AdminUsersPage';

export const metadata = { title: 'Team' };

export default function Page() {
  return <AdminUsersPage roles={['admin', 'support']} />;
}
