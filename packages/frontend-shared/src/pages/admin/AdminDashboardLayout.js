import { AdminAuthProvider } from '../../contexts/AdminAuthContext';
import AdminShell from '../../components/admin/AdminShell';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import NewOrderPinger from '../../components/admin/NewOrderPinger';

export default function AdminDashboardLayout({ children, nav, brand }) {
  return (
    <AdminAuthProvider>
      <AdminShell>
        <NewOrderPinger />
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
          <AdminSidebar nav={nav} brand={brand} />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </AdminShell>
    </AdminAuthProvider>
  );
}
