import AdminDashboardLayout from "@travel-suite/frontend-shared/pages/admin/AdminDashboardLayout";

export const metadata = {
  title: {
    // absolute, not default: a nested default is still fed through the root
    // layout's "%s | VisaWadi" template, which is what doubled the brand name.
    absolute: "Admin | VisaWadi",
    template: "%s | VisaWadi Admin",
  },
  robots: { index: false, follow: false },
};

const nav = [
  {
    section: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin", mobile: 1, mobileLabel: "Home",
        icon: "LayoutDashboard",
        exact: true,
        roles: ["admin", "agent"],
      },
    ],
  },
  {
    section: "Orders",
    items: [
      {
        label: "Visa Leads",
        href: "/admin/visa-leads", mobile: 3, mobileLabel: "Leads",
        icon: "Inbox",
        roles: ["admin"],
      },
      {
        label: "Visa Applications",
        href: "/admin/visa-applications", mobile: 2, mobileLabel: "Visas",
        icon: "ClipboardList",
        roles: ["admin", "agent"],
      },
      {
        label: "Document Registry",
        href: "/admin/document-registry",
        icon: "FileText",
        roles: ["admin"],
      },
    ],
  },
  {
    section: "Content",
    items: [
      {
        label: "Blog",
        href: "/admin/blog",
        icon: "BookOpen",
        roles: ["admin", "blog-manager"],
      },
      {
        label: "Blog Tags",
        href: "/admin/blog-tags",
        icon: "Tag",
        roles: ["admin", "blog-manager"],
      },
      {
        label: "Visa Pages",
        href: "/admin/visa",
        icon: "Stamp",
        roles: ["admin"],
      },
    ],
  },
  {
    section: "Finance",
    items: [
      {
        label: "Revenue",
        href: "/admin/revenue",
        icon: "TrendingUp",
        roles: ["admin"],
      },
      {
        label: "Payment Links",
        href: "/admin/payment-links",
        icon: "Link2",
        roles: ["admin", "agent"],
      },
      {
        label: "Products",
        href: "/admin/products",
        icon: "Package",
        roles: ["admin", "agent"],
      },
      {
        label: "Currencies",
        href: "/admin/currencies",
        icon: "CircleDollarSign",
        roles: ["admin"],
      },
    ],
  },
  {
    section: "People",
    items: [
      {
        label: "Admin Users",
        href: "/admin/users",
        icon: "Users",
        roles: ["admin"],
      },
    ],
  },
  {
    section: "Settings",
    items: [
      {
        label: "My Account",
        href: "/admin/account", mobile: 4, mobileLabel: "Account",
        icon: "UserCircle",
        roles: ["admin", "agent", "blog-manager"],
      },
    ],
  },
];

const brand = { name: "VisaWadi", icon: "Plane" };

export default function Layout({ children }) {
  return (
    <AdminDashboardLayout nav={nav} brand={brand}>
      {children}
    </AdminDashboardLayout>
  );
}
