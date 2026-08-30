import './admin.css';
import AdminProviders from './AdminProviders';

// Wraps the whole /admin subtree (login + dashboard). Keeps admin out of search
// indexes and pulls Tailwind into the bundle for these routes only. The customer
// topbar/footer are hidden on /admin by SiteChrome, so this renders as its own
// surface.
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
