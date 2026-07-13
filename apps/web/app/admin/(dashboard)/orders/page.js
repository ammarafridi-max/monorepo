'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminOrders, usd, dateOnly, STATUS_LABEL } from '../../../../lib/adminApi';

const STATUSES = ['AWAITING_PAYMENT', 'PAID', 'TRAINING', 'GENERATING', 'DELIVERED', 'FAILED'];

function StatusPill({ status }) {
  const cls =
    status === 'DELIVERED' ? 'pill pill--ok' : status === 'FAILED' ? 'pill pill--warn' : 'pill';
  return <span className={cls}>{STATUS_LABEL[status] || status}</span>;
}

function OrdersView() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status') || '';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    getAdminOrders({ status })
      .then(setData)
      .catch((e) => setError(e.message || 'Could not load orders.'));
  }, [status]);

  function onFilter(e) {
    const v = e.target.value;
    router.replace(v ? `/admin/orders?status=${v}` : '/admin/orders');
  }

  return (
    <>
      <header className="adm-head">
        <h1>Orders</h1>
        <p className="adm-muted">
          {data ? `${data.count} shown, newest first.` : 'Loading orders.'}
          {data?.stuckCount ? ` ${data.stuckCount} stuck.` : ''}
        </p>
      </header>

      <div className="adm-filters">
        <label className="adm-field adm-field--inline">
          <span>Status</span>
          <select value={status} onChange={onFilter}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {data && (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th className="adm-num">Paid</th>
                <th className="adm-num">Margin</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr
                  key={o.orderId}
                  className={o.stuck ? 'adm-row--stuck' : undefined}
                  onClick={() => router.push(`/admin/orders/${o.orderId}`)}
                >
                  <td>
                    <Link className="adm-link" href={`/admin/orders/${o.orderId}`}>
                      {o.orderId.slice(-8)}
                    </Link>
                    {o.stuck && <span className="adm-flag">stuck {o.stuckForMinutes}m</span>}
                  </td>
                  <td>{o.customerEmail}</td>
                  <td>
                    <StatusPill status={o.status} />
                  </td>
                  <td className="adm-num">{usd(o.amountPaidCents)}</td>
                  <td className="adm-num">{usd(o.marginCents)}</td>
                  <td>{dateOnly(o.createdAt)}</td>
                </tr>
              ))}
              {data.orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-muted">
                    No orders match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="adm-muted">Loading orders</p>}>
      <OrdersView />
    </Suspense>
  );
}
