'use client';

import { useEffect, useState } from 'react';
import { getAdminCustomers, usd, dateOnly } from '../../../../lib/adminApi';

export default function CustomersPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminCustomers()
      .then(setData)
      .catch((e) => setError(e.message || 'Could not load customers.'));
  }, []);

  return (
    <>
      <header className="adm-head">
        <h1>Customers</h1>
        <p className="adm-muted">
          {data ? `${data.count} by email, most recent first.` : 'Loading customers.'}
        </p>
      </header>

      {error && <p className="adm-error">{error}</p>}

      {data && (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Email</th>
                <th className="adm-num">Orders</th>
                <th className="adm-num">Delivered</th>
                <th className="adm-num">Spent</th>
                <th>Account</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.map((c) => (
                <tr key={c.email}>
                  <td>{c.email}</td>
                  <td className="adm-num">{c.orders}</td>
                  <td className="adm-num">{c.delivered}</td>
                  <td className="adm-num">{usd(c.totalPaidCents)}</td>
                  <td>{c.hasAccount ? 'Yes' : 'Guest'}</td>
                  <td>{dateOnly(c.lastOrderAt)}</td>
                </tr>
              ))}
              {data.customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-muted">
                    No customers yet.
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
