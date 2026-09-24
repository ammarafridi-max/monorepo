import AdminLoginPage from '@travel-suite/frontend-shared/pages/admin/AdminLoginPage';

export const metadata = {
  title: 'Reset Password | Admin',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminLoginPage siteName="The Dummy Ticket AE" useOtp variant="forgot" />;
}
