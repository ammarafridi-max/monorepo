import AdminUsersPage from '@travel-suite/frontend-shared/pages/admin/AdminUsersPage';

export const metadata = { title: 'Team' };

// Picturesk staff are admin (full access) or support (read-only).
export default function Page() {
  return <AdminUsersPage roles={['admin', 'support']} />;
}
