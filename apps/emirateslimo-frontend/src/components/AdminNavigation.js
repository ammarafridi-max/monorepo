'use client';

import {
  HiOutlineUsers,
  HiOutlineTicket,
  HiOutlineHome,
  HiOutlineMap,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineRss,
} from 'react-icons/hi2';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const links = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: HiOutlineHome,
    accessTo: ['admin', 'agent'],
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: HiOutlineCalendar,
    accessTo: ['admin', 'agent'],
  },
  {
    name: 'Zones',
    href: '/admin/zones',
    icon: HiOutlineMap,
    accessTo: ['admin', 'agent'],
  },
  {
    name: 'Vehicles',
    href: '/admin/vehicles',
    icon: HiOutlineUsers,
    accessTo: ['admin'],
  },
  {
    name: 'Pricing Rules',
    href: '/admin/pricing',
    icon: HiOutlineTicket,
    accessTo: ['admin', 'agent'],
  },
  {
    name: 'Availability Rules',
    href: '/admin/availability-rules',
    icon: HiOutlineTicket,
    accessTo: ['admin', 'agent'],
  },
  {
    name: 'Currencies',
    href: '/admin/currencies',
    icon: HiOutlineCurrencyDollar,
    accessTo: ['admin', 'agent'],
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: HiOutlineUsers,
    accessTo: ['admin', 'agent'],
  },
  {
    name: 'Blogs',
    href: '/admin/blogs',
    icon: HiOutlineRss,
    accessTo: ['admin', 'blog-manager'],
  },
  {
    name: 'Blog Tags',
    href: '/admin/blog-tags',
    icon: HiOutlineTicket,
    accessTo: ['admin', 'blog-manager'],
  },
];

export default function AdminNavigation() {
  return (
    <aside className="h-dvh w-full flex flex-col justify-between py-6 px-3 overflow-y-auto">
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {links.map((link, i) => (
          <SidebarLink
            key={i}
            name={link.name}
            href={link.href}
            Icon={link.icon}
            accessTo={link.accessTo}
          />
        ))}
      </nav>
      <div className="px-5 text-xs text-gray-500 mt-auto">
        <p>© {new Date().getFullYear()} Emirates Limo</p>
      </div>
    </aside>
  );
}

function SidebarLink({ name, href, Icon, accessTo }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isActive =
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  if (accessTo && !accessTo.includes(user?.role)) return null;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
        isActive
          ? 'bg-[#FF6B00] text-white shadow-md'
          : 'text-gray-300 hover:text-white hover:bg-[#FF6B00]/10'
      }`}
    >
      <Icon
        className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#FF6B00]'}`}
      />
      <span className="text-sm tracking-wide">{name}</span>
    </Link>
  );
}
