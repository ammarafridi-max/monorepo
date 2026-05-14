import AdminDashboardLayout from '@travel-suite/frontend-shared/pages/admin/AdminDashboardLayout';

export const metadata = {
  title: {
    default: 'Admin — Dummy Ticket 365',
    template: '%s | DT365 Admin',
  },
  robots: { index: false, follow: false },
};

const nav = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard', exact: true, roles: ['admin', 'agent'] },
    ],
  },
  {
    section: 'Orders',
    items: [
      { label: 'Dummy Tickets', href: '/admin/dummy-tickets', icon: 'Ticket', exact: true, roles: ['admin', 'agent'] },
      { label: "Today's Deliveries", href: '/admin/dummy-tickets/today', icon: 'CalendarCheck', roles: ['admin', 'agent', 'blog-manager'] },
      { label: 'Insurance', href: '/admin/insurance-applications', icon: 'ShieldCheck', roles: ['admin', 'agent'] },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Blog', href: '/admin/blog', icon: 'BookOpen', roles: ['admin', 'blog-manager'] },
      { label: 'Blog Tags', href: '/admin/blog-tags', icon: 'Tag', roles: ['admin', 'blog-manager'] },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'Revenue', href: '/admin/revenue', icon: 'TrendingUp', roles: ['admin'] },
      { label: 'Payment Links', href: '/admin/payment-links', icon: 'Link2', roles: ['admin', 'agent'] },
      { label: 'Products', href: '/admin/products', icon: 'Package', roles: ['admin', 'agent'] },
      { label: 'Pricing', href: '/admin/pricing', icon: 'DollarSign', roles: ['admin'] },
      { label: 'Currencies', href: '/admin/currencies', icon: 'CircleDollarSign', roles: ['admin'] },
    ],
  },
  {
    section: 'People',
    items: [
      { label: 'Admin Users', href: '/admin/users', icon: 'Users', roles: ['admin'] },
      { label: 'Affiliates', href: '/admin/affiliates', icon: 'Handshake', roles: ['admin'] },
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'My Account', href: '/admin/account', icon: 'UserCircle', roles: ['admin', 'agent', 'blog-manager'] },
    ],
  },
];

const brand = { name: 'DT365', icon: 'Ticket' };

export default function Layout({ children }) {
  return (
    <AdminDashboardLayout nav={nav} brand={brand}>
      {children}
    </AdminDashboardLayout>
  );
}
