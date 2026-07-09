import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import { dbConnect } from '../../lib/db';
import { Order } from '@headliner/shared';

// The only gated area. Reading the session (cookies) makes it dynamic anyway;
// force-dynamic is explicit since it also queries Mongo.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your orders. Headliner' };

const STATUS_LABEL = {
  AWAITING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  TRAINING: 'Training',
  GENERATING: 'Generating',
  DELIVERED: 'Delivered',
  FAILED: 'Did not work out',
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  await dbConnect();
  const orders = await Order.find({ userId: session.userId }).sort({ createdAt: -1 }).lean();

  // Sanitized, same shape the public status page uses: no cost, Stripe, or
  // Replicate internals.
  const view = orders.map((o) => ({
    orderId: o._id.toString(),
    status: o.status,
    date: new Date(o.createdAt).toISOString().slice(0, 10),
  }));

  return (
    <main className="wrap">
      <h1 className="display">Your orders.</h1>
      <p className="lede muted">Signed in as {session.email}.</p>

      {view.length === 0 ? (
        <p className="formnote" style={{ textAlign: 'left', marginTop: 24 }}>
          No orders yet. <a href="/">Start your first set</a>.
        </p>
      ) : (
        <ul className="orders">
          {view.map((o) => (
            <li className="order" key={o.orderId}>
              <div>
                <div className="order__id">Order {o.orderId}</div>
                <div className="order__date muted">{o.date}</div>
              </div>
              <span className="pill">{STATUS_LABEL[o.status] || o.status}</span>
              <a className="order__link" href={`/success?orderId=${o.orderId}`}>
                View
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
