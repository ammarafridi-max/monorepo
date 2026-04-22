import AdminSidebar from "@travel-suite/frontend-shared/components/v2/admin/AdminSidebar";
import AdminHeader from "@travel-suite/frontend-shared/components/v2/admin/AdminHeader";
import AdminShell from "@travel-suite/frontend-shared/components/v2/admin/AdminShell";
import { AdminAuthProvider } from "@travel-suite/frontend-shared/contexts/AdminAuthContext";

export const metadata = {
  title: {
    default: "Admin — TravelShield",
    template: "%s | TravelShield Admin",
  },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }) {
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
