import AdminDashboardLayout from '@travel-suite/frontend-shared/pages/admin/AdminDashboardLayout';

export const metadata = {
  title: {
    default: 'Admin — Travl',
    template: '%s | Travl Admin',
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
      { label: 'Insurance', href: '/admin/insurance-applications', icon: 'ShieldCheck', roles: ['admin', 'agent'] },
      { label: 'Itineraries', href: '/admin/itineraries', icon: 'MapPin', roles: ['admin', 'agent'] },
      { label: 'Visa Leads', href: '/admin/visa-leads', icon: 'Inbox', roles: ['admin'] },
    ],
  },
  {
    section: 'Emails',
    items: [
      { label: 'Email Support', href: '/admin/emails', icon: 'Mail', roles: ['admin', 'agent'] },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Blog', href: '/admin/blog', icon: 'BookOpen', roles: ['admin', 'blog-manager'] },
      { label: 'Blog Tags', href: '/admin/blog-tags', icon: 'Tag', roles: ['admin', 'blog-manager'] },
      { label: 'Visa Pages', href: '/admin/visa', icon: 'Stamp', roles: ['admin'] },
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

const brand = { name: 'Travl', icon: 'Plane' };

export default function Layout({ children }) {
  return (
    <AdminDashboardLayout nav={nav} brand={brand}>
      {children}
    </AdminDashboardLayout>
  );
}
