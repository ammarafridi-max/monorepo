import '../globals.css';
import './shared-ui.css';
import { getSession } from '../../lib/session';
import SiteChrome from '../../components/SiteChrome';
import Analytics from '../../components/Analytics';

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
