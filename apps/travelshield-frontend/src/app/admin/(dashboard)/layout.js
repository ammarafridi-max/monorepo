import AdminSidebar from "@travel-suite/frontend-shared/components/admin/v2/AdminSidebar";
import AdminHeader from "@travel-suite/frontend-shared/components/admin/v2/AdminHeader";
import AdminShell from "@travel-suite/frontend-shared/components/admin/v2/AdminShell";
import { AdminAuthProvider } from "@travel-suite/frontend-shared/contexts/AdminAuthContext";

export const metadata = {
  title: {
    default: "Admin — TravelShield",
    template: "%s | TravelShield Admin",
  },
  robots: { index: false, follow: false },
};

const nav = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", exact: true, roles: ["admin", "agent"] },
    ],
  },
  {
    section: "Insurance",
    items: [
      { label: "Applications", href: "/admin/insurance-applications", icon: "ClipboardList", roles: ["admin", "agent"] },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Blog", href: "/admin/blog", icon: "BookOpen", roles: ["admin", "blog-manager"] },
      { label: "Blog Tags", href: "/admin/blog-tags", icon: "Tag", roles: ["admin", "blog-manager"] },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "Currencies", href: "/admin/currencies", icon: "CircleDollarSign", roles: ["admin", "agent"] },
    ],
  },
  {
    section: "People",
    items: [
      { label: "Admin Users", href: "/admin/users", icon: "Users", roles: ["admin"] },
      { label: "Affiliates", href: "/admin/affiliates", icon: "Handshake", roles: ["admin", "agent"] },
    ],
  },
  {
    section: "Settings",
    items: [
      { label: "My Account", href: "/admin/account", icon: "UserCircle", roles: ["admin", "agent", "blog-manager"] },
    ],
  },
];

const brand = { name: "TravelShield", icon: "Shield" };

export default function DashboardLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminShell>
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
