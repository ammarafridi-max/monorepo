import AdminLoginPage from '@travel-suite/frontend-shared/pages/admin/AdminLoginPage';
import { Camera } from 'lucide-react';

export const metadata = {
  title: 'Reset password. Picturesk',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminLoginPage siteName="Picturesk" icon={Camera} useOtp variant="forgot" />;
}
