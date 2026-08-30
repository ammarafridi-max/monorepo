import AdminDashboardLayout from '@travel-suite/frontend-shared/pages/admin/AdminDashboardLayout';

export const metadata = {
  title: {
    absolute: 'Admin | Travl',
    template: '%s | Travl Admin',
  },
  robots: { index: false, follow: false },
};

const nav = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', mobile: 1, mobileLabel: 'Home', icon: 'LayoutDashboard', exact: true, roles: ['admin', 'agent'] },
    ],
  },
  {
    section: 'Orders',
    items: [
      { label: 'Insurance', href: '/admin/insurance-applications', mobile: 2, icon: 'ShieldCheck', roles: ['admin', 'agent'] },
      { label: 'Itineraries', href: '/admin/itineraries', mobile: 3, mobileLabel: 'Trips', icon: 'MapPin', roles: ['admin', 'agent'] },
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
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'My Account', href: '/admin/account', mobile: 4, mobileLabel: 'Account', icon: 'UserCircle', roles: ['admin', 'agent', 'blog-manager'] },
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
