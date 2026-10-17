import './admin.css';
import AdminProviders from './AdminProviders';

export const metadata = {
  title: 'Admin. Picturesk',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <div className="picturesk-admin">
      <AdminProviders>{children}</AdminProviders>
    </div>
  );
}
