import { AdminAuthProvider } from '../../contexts/AdminAuthContext';
import AdminShell from '../../components/admin/AdminShell';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminMobileTabBar from '../../components/admin/AdminMobileTabBar';
import NewOrderPinger from '../../components/admin/NewOrderPinger';

/**
 * `roleRules` / `roleDefaultPath` default to the travel dashboard's routes; an app
 * with a different admin passes its own. `newOrderPing` polls the dummy-tickets
 * endpoint and `globalSearch` queries five travel domains, so apps without those
 * must turn them off.
 */
export default function AdminDashboardLayout({
  children,
  nav,
  brand,
  roleRules,
  roleDefaultPath,
  newOrderPing = true,
  globalSearch = true,
}) {
  return (
    <AdminAuthProvider>
      <AdminShell roleRules={roleRules} roleDefaultPath={roleDefaultPath}>
        {newOrderPing && <NewOrderPinger />}
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
          <AdminSidebar nav={nav} brand={brand} />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AdminHeader globalSearch={globalSearch} />
            <main className="flex-1 overflow-y-auto p-4 pb-[calc(3.5rem+1rem+env(safe-area-inset-bottom))] lg:p-6">
              {children}
            </main>
          </div>
          <AdminMobileTabBar nav={nav} brand={brand} />
        </div>
      </AdminShell>
    </AdminAuthProvider>
  );
}
