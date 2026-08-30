import AdminLoginPage from '@travel-suite/frontend-shared/pages/admin/AdminLoginPage';
import { Camera } from 'lucide-react';

export const metadata = {
  title: 'Admin sign in. Picturesk',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AdminLoginPage
      siteName="Picturesk"
      icon={Camera}
      headline={
        <>
          Run the
          <br />
          headshot studio
        </>
      }
      blurb="Track every order from payment to delivery, watch margin and compute cost, and step in when a job stalls."
      highlights={[
        { label: 'Orders', value: 'Pipeline and delivery' },
        { label: 'Revenue', value: 'Margin and cost' },
        { label: 'Customers', value: 'Spend and history' },
        { label: 'Team', value: 'Staff accounts' },
      ]}
    />
  );
}
