import AdminLoginPage from '@travel-suite/frontend-shared/pages/admin/AdminLoginPage';

export const metadata = {
  title: 'Sign In — Admin',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminLoginPage siteName="Travl" />;
}
