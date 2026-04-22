import Link from 'next/link';
import { ClipboardList, ArrowRight } from 'lucide-react';

const JOURNEY_LABELS = {
  single: { label: 'Single', color: 'bg-primary-50 text-primary-700 border-primary-200' },
  annual: { label: 'Annual', color: 'bg-accent-50 text-accent-700 border-accent-200' },
  biennial: { label: '2-Year', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

function PaymentBadge({ status }) {
  const cfg = {
    PAID: { label: 'Paid', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    UNPAID: { label: 'Unpaid', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    PENDING: { label: 'Pending', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
    FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    REFUNDED: { label: 'Refunded', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  }[status] || { label: status || '—', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2 py-0.5 rounded-full ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function JourneyBadge({ type }) {
  const cfg = JOURNEY_LABELS[type] ?? { label: type, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

/**
 * @param {{ applications: Array }} props
 * `applications` shape (from backend /api/insurance):
 *  { _id, sessionId, leadPassenger (virtual), email, region, journeyType,
 *    amountPaid: { currency, amount }, paymentStatus, createdAt }
 */
export default function RecentApplicationsTable({ applications = [] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900 text-sm">Recent Applications</p>
          <p className="text-xs text-gray-400 mt-0.5">Latest insurance submissions</p>
        </div>
        <Link
          href="/admin/insurance-applications"
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <ClipboardList size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No applications yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Applications will appear here once customers start booking.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Lead Passenger', 'Email', 'Region', 'Type', 'Amount', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applications.map((app) => (
                <tr key={app._id ?? app.sessionId} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                    <Link href={`/admin/insurance-applications/${app.sessionId}`} className="hover:text-primary-700 hover:underline">
                      {app.leadPassenger ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-[180px] truncate">
                    {app.email}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                    {app.region?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <JourneyBadge type={app.journeyType} />
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                    {app.amountPaid?.amount != null
                      ? `${app.amountPaid.currency ?? 'AED'} ${Number(app.amountPaid.amount).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <PaymentBadge status={app.paymentStatus} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap text-xs">
                    {app.createdAt
                      ? new Date(app.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
