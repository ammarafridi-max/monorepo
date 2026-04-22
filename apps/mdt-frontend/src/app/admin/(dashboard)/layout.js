import { AdminAuthProvider } from '@travel-suite/frontend-shared/contexts/AdminAuthContext';
import AdminShell from '@travel-suite/frontend-shared/components/v1/admin/AdminShell';
import AdminSidebar from '@travel-suite/frontend-shared/components/v1/admin/AdminSidebar';
import AdminHeader from '@travel-suite/frontend-shared/components/v1/admin/AdminHeader';

export const metadata = {
  title: {
    default: 'Admin — Travl',
    template: '%s | Travl Admin',
  },
  robots: { index: false, follow: false },
};

export default function AdminDashboardLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminShell>
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
          <AdminSidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </AdminShell>
    </AdminAuthProvider>
  );
}
