import '../globals.css';
import { getSession } from '../../lib/session';
import SiteChrome from '../../components/SiteChrome';
import Analytics from '../../components/Analytics';

// Everything customer-facing. /admin is outside this group, so neither the
// stylesheet nor the topbar/footer reach it.
export default async function SiteLayout({ children }) {
  const session = await getSession();

  return (
    <>
      <Analytics />
      <SiteChrome authed={Boolean(session)} email={session?.email}>
        {children}
      </SiteChrome>
    </>
  );
}
