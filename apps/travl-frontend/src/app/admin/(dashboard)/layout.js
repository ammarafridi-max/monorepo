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
      { label: 'Flight Reservations', href: '/admin/flight-reservations', mobile: 2, mobileLabel: 'Flights', icon: 'Ticket', exact: true, badge: 'pendingDummyTickets', roles: ['admin', 'agent'] },
      { label: "Today's Deliveries", href: '/admin/flight-reservations/today', icon: 'CalendarCheck', roles: ['admin', 'agent'] },
      { label: 'Insurance', href: '/admin/insurance-applications', mobile: 3, icon: 'ShieldCheck', roles: ['admin', 'agent'] },
      { label: 'Itineraries', href: '/admin/itineraries', mobileLabel: 'Trips', icon: 'MapPin', roles: ['admin', 'agent'] },
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
    ],
  },
  {
    section: 'Catalogue',
    items: [
      { label: 'Airline Logos', href: '/admin/airline-logos', icon: 'Plane', roles: ['admin'] },
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
