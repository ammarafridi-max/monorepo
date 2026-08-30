'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminStats, usd, STATUS_LABEL } from '../../../lib/adminApi';

// Order in which to show the status breakdown (lifecycle order, not alphabetical).
const STATUS_ORDER = ['AWAITING_PAYMENT', 'PAID', 'TRAINING', 'GENERATING', 'DELIVERED', 'FAILED'];

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((e) => setError(e.message || 'Could not load metrics.'));
  }, []);

  if (error) return <p className="adm-error">{error}</p>;
  if (!stats) return <p className="adm-muted">Loading metrics</p>;

  return (
    <>
      <header className="adm-head">
        <h1>Overview</h1>
        <p className="adm-muted">Revenue, margin, and where orders stand right now.</p>
      </header>

      <div className="adm-stats">
        <Stat label="Delivered revenue" value={usd(stats.deliveredRevenueCents)} />
        <Stat label="Delivered margin" value={usd(stats.deliveredMarginCents)} accent />
        <Stat label="Compute cost" value={usd(stats.computeCostCents)} />
        <Stat label="Orders delivered" value={String(stats.deliveredCount)} />
        <Stat label="Total orders" value={String(stats.totalOrders)} />
        <Stat
          label="Stuck now"
          value={String(stats.stuckCount)}
          warn={stats.stuckCount > 0}
          hint={`over ${stats.stuckAfterMinutes} min`}
        />
        <Stat label="Refunded" value={String(stats.refundedCount)} warn={stats.refundedCount > 0} />
        <Stat label="Gross paid" value={usd(stats.revenueCents)} />
      </div>

      <section className="adm-card">
        <div className="adm-card__head">
          <h2>By status</h2>
          {stats.stuckCount > 0 && (
            <Link className="adm-link" href="/admin/orders">
              Review stuck orders
            </Link>
          )}
        </div>
        <div className="adm-statusgrid">
          {STATUS_ORDER.map((s) => (
            <Link key={s} href={`/admin/orders?status=${s}`} className="adm-statusrow">
              <span>{STATUS_LABEL[s]}</span>
              <span className="adm-statusrow__n">{stats.byStatus?.[s] ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, hint, accent, warn }) {
  return (
    <div className={`adm-stat${accent ? ' adm-stat--accent' : ''}${warn ? ' adm-stat--warn' : ''}`}>
      <div className="adm-stat__label">{label}</div>
      <div className="adm-stat__value">{value}</div>
      {hint && <div className="adm-stat__hint">{hint}</div>}
    </div>
  );
}
