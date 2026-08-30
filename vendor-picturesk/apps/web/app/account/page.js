import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import { dbConnect } from '../../lib/db';
import { Order, User } from '@picturesk/shared';
import { getTier } from '@picturesk/shared/pricing';
import { downloadAllUrl } from '../../lib/api';
import AccountTabs from './AccountTabs';
import PasswordForm from './PasswordForm';
import DeleteAccount from './DeleteAccount';
import DeleteOrderButton from './DeleteOrderButton';
import { FiLogOut } from 'react-icons/fi';

// The only gated area. Reading the session (cookies) makes it dynamic anyway;
// force-dynamic is explicit since it also queries Mongo.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your account. Picturesk.ai', robots: { index: false, follow: false } };

const STATUS_LABEL = {
  AWAITING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  TRAINING: 'Training',
  GENERATING: 'Generating',
  DELIVERED: 'Delivered',
  FAILED: 'Did not work out',
};
const PILL_CLASS = { DELIVERED: 'pill--ok', FAILED: 'pill--warn' };
const PROVIDER_LABEL = { google: 'Google', facebook: 'Facebook', linkedin: 'LinkedIn' };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  await dbConnect();
  const [user, orders] = await Promise.all([
    User.findById(session.userId).lean(),
    Order.find({ userId: session.userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const hasPassword = Boolean(user?.passwordHash);
  const providers = (user?.providers || []).map((p) => PROVIDER_LABEL[p] || p);
  const methods = [...(hasPassword ? ['Password'] : []), ...providers];
  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.createdAt))
    : null;

  // Sanitized order view: no cost, Stripe, or Replicate internals. Delivered orders
  // carry a single thumbnail (the first persisted headshot) for the card preview.
  const view = orders.map((o) => {
    const tier = getTier(o.tier);
    return {
      orderId: o._id.toString(),
      short: o._id.toString().slice(-6),
      status: o.status,
      delivered: o.status === 'DELIVERED',
      date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(o.createdAt)
      ),
      tierLabel: tier.label,
      count: o.deliverCount ?? tier.deliverCount,
      thumb: o.status === 'DELIVERED' ? o.deliveredImageUrls?.[0] || null : null,
    };
  });

  return (
    <main className="wrap wrap--wide acct">
      <header className="acct__head">
        <h1 className="display">Your account.</h1>
        <p className="lede muted">Signed in as {session.email}.</p>
        <div className="acct__meta">
          {memberSince && <span className="tag">Member since {memberSince}</span>}
          {methods.map((m) => (
            <span className="tag" key={m}>
              {m}
            </span>
          ))}
          <form action="/api/auth/logout" method="post" className="acct__signout-form">
            <button className="acct__signout" type="submit">
              <FiLogOut aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <AccountTabs
        tabs={[
          { key: 'orders', label: 'Orders', count: view.length },
          { key: 'settings', label: 'Settings' },
        ]}
      >
        {/* Panel 1: Orders */}
        <div>
          {view.length === 0 ? (
            <div className="acct__card acct__empty">
              <p>No orders yet.</p>
              <a className="btn btn--primary" href="/ai-headshot-generator/select">
                Start your first set <span className="btn__price">from $9</span>
              </a>
            </div>
          ) : (
            <ul className="ords">
              {view.map((o) => (
                <li className="ord" key={o.orderId}>
                  <div className={`ord__media${o.thumb ? '' : ' ord__media--empty'}`}>
                    {o.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.thumb} alt="" loading="lazy" />
                    ) : (
                      <span className="ord__ph">{o.count}</span>
                    )}
                  </div>
                  <div className="ord__body">
                    <p className="ord__title">
                      {o.tierLabel} · {o.count} headshots
                    </p>
                    <p className="ord__sub muted">
                      Ordered {o.date} · #{o.short}
                    </p>
                  </div>
                  <span className={`pill ${PILL_CLASS[o.status] || ''}`}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                  <div className="ord__actions">
                    <a className="btn btn--link" href={`/success?orderId=${o.orderId}`}>
                      View
                    </a>
                    {o.delivered && (
                      <a className="btn btn--link" href={downloadAllUrl(o.orderId)}>
                        Download
                      </a>
                    )}
                    {process.env.NODE_ENV === 'development' && (
                      <DeleteOrderButton orderId={o.orderId} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Panel 2: Settings */}
        <div>
          <section className="acct__section acct__section--first">
            <h2 className="acct__h2">Password</h2>
            <p className="acct__hint">
              {hasPassword
                ? 'Change the password you use to sign in with email.'
                : `You sign in with ${providers[0] || 'a social account'}. Set a password to also sign in with your email.`}
            </p>
            <div className="acct__card">
              <PasswordForm hasPassword={hasPassword} />
            </div>
          </section>

          <section className="acct__section acct__section--danger">
            <h2 className="acct__h2">Delete account</h2>
            <p className="acct__hint">
              Remove your login. Your orders revert to anonymous and your delivered headshots stay
              downloadable from their links.
            </p>
            <DeleteAccount />
          </section>
        </div>
      </AccountTabs>
    </main>
  );
}
