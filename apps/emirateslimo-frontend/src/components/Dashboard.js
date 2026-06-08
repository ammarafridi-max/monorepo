'use client';

import PageHeading from '@/components/PageHeading';
import Breadcrumb from '@/components/Breadcrumb';

export default function Dashboard() {
  return (
    <>
      <Breadcrumb
        paths={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard', href: '/' },
        ]}
      />
      <PageHeading className="mb-6">Dashboard</PageHeading>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Bookings',
            value: '—',
            color: 'bg-[#FF6B00]/10 text-[#FF6B00]',
          },
          {
            label: 'Total Revenue',
            value: '—',
            color: 'bg-green-100 text-green-700',
          },
          {
            label: 'Active Vehicles',
            value: '—',
            color: 'bg-blue-100 text-blue-700',
          },
          {
            label: 'Agents Online',
            value: '—',
            color: 'bg-gray-100 text-gray-700',
          },
        ].map((metric, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">{metric.label}</p>
            <h3 className="text-2xl font-semibold text-gray-900 mt-1">
              {metric.value}
            </h3>
            <span
              className={`inline-block text-xs font-medium mt-3 px-2.5 py-1 rounded-full w-fit ${metric.color}`}
            >
              Sample Data
            </span>
          </div>
        ))}
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Bookings Overview
          </h3>
          <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
            Chart Placeholder
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Recent Activity
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              • New booking created —{' '}
              <span className="text-gray-400">sample</span>
            </li>
            <li>
              • Vehicle updated — <span className="text-gray-400">sample</span>
            </li>
            <li>
              • Agent logged in — <span className="text-gray-400">sample</span>
            </li>
            <li>
              • Pricing rule modified —{' '}
              <span className="text-gray-400">sample</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
