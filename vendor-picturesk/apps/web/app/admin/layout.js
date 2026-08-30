import './admin.css';

// Wraps the whole /admin subtree (login + dashboard). Keeps admin out of search
// indexes and loads the admin stylesheet once. The customer topbar/footer are
// hidden on /admin by SiteChrome, so this area renders as its own surface.
export const metadata = {
  title: 'Admin. Picturesk',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
