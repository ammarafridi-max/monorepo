import AdminDashboardLayout from '@travel-suite/frontend-shared/pages/admin/AdminDashboardLayout';

export const metadata = {
  title: { absolute: 'Admin. Picturesk', template: '%s. Picturesk Admin' },
  robots: { index: false, follow: false },
};

const nav = [
  {
    section: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        mobile: 1,
        mobileLabel: 'Home',
        icon: 'LayoutDashboard',
        exact: true,
        roles: ['admin', 'support'],
      },
    ],
  },
  {
    section: 'Orders',
    items: [
      {
        label: 'Orders',
        href: '/admin/orders',
        mobile: 2,
        mobileLabel: 'Orders',
        icon: 'Camera',
        roles: ['admin', 'support'],
      },
      {
        label: 'Customers',
        href: '/admin/customers',
        mobile: 3,
        mobileLabel: 'People',
        icon: 'Users',
        roles: ['admin', 'support'],
      },
    ],
  },
  {
    section: 'People',
    items: [
      { label: 'Team', href: '/admin/users', icon: 'Shield', roles: ['admin'] },
    ],
  },
  {
    section: 'Settings',
    items: [
      {
        label: 'My Account',
        href: '/admin/account',
        mobile: 4,
        mobileLabel: 'Account',
        icon: 'UserCircle',
        roles: ['admin', 'support'],
      },
    ],
  },
];

const brand = { name: 'Picturesk', icon: 'Camera' };

// Picturesk staff are admin (full access) or support (read-only), so the travel
// dashboard's rules do not apply. Staff CRUD is the only admin-only area.
const roleRules = [
  { prefix: '/admin/users', roles: ['admin'] },
  { prefix: '/admin', roles: ['admin', 'support'] },
];

const roleDefaultPath = { admin: '/admin', support: '/admin' };

export default function Layout({ children }) {
  return (
    <AdminDashboardLayout
      nav={nav}
      brand={brand}
      roleRules={roleRules}
      roleDefaultPath={roleDefaultPath}
      newOrderPing={false}
      globalSearch={false}
    >
      {children}
    </AdminDashboardLayout>
  );
}
