import AdminDashboardLayout from '@travel-suite/frontend-shared/pages/admin/AdminDashboardLayout';

export const metadata = {
  title: {
    absolute: 'Admin | Emirates Limo',
    template: '%s | Emirates Limo Admin',
  },
  robots: { index: false, follow: false },
};

const nav = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', mobile: 1, mobileLabel: 'Home', icon: 'LayoutDashboard', exact: true, roles: ['admin', 'agent', 'blog-manager'] },
    ],
  },
  {
    section: 'Bookings',
    items: [
      { label: 'Bookings', href: '/admin/bookings', mobile: 2, icon: 'Ticket', exact: true, roles: ['admin', 'agent'] },
      { label: 'Calendar', href: '/admin/bookings/calendar', mobile: 3, icon: 'CalendarDays', roles: ['admin', 'agent'] },
    ],
  },
  {
    section: 'Fleet',
    items: [
      { label: 'Vehicles', href: '/admin/vehicles', icon: 'Car', roles: ['admin'] },
      { label: 'Zones', href: '/admin/zones', icon: 'MapPin', roles: ['admin'] },
      { label: 'Pricing Rules', href: '/admin/pricing-rules', icon: 'DollarSign', roles: ['admin'] },
      { label: 'Availability Rules', href: '/admin/availability-rules', icon: 'SlidersHorizontal', roles: ['admin'] },
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
    section: 'Settings',
    items: [
      { label: 'Currencies', href: '/admin/currencies', icon: 'CircleDollarSign', roles: ['admin'] },
      { label: 'Admin Users', href: '/admin/users', icon: 'Users', roles: ['admin'] },
      { label: 'My Account', href: '/admin/account', mobile: 4, mobileLabel: 'Account', icon: 'UserCircle', roles: ['admin', 'agent', 'blog-manager'] },
    ],
  },
];

const brand = { name: 'Emirates Limo', icon: 'Car' };

export default function Layout({ children }) {
  return (
    <AdminDashboardLayout nav={nav} brand={brand}>
      {children}
    </AdminDashboardLayout>
  );
}
