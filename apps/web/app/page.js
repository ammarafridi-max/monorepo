import { getSession } from '../lib/session';
import UploadForm from './UploadForm';

// Server wrapper: read the session so a logged-in user's order can be linked and
// their email prefilled. Anonymous visitors get the exact same form as before.
export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="wrap">
      <h1 className="display">Headshots that don&apos;t look AI.</h1>
      <p className="lede">
        Upload a few selfies. We train a model on your face and give you studio-quality
        headshots, ready for LinkedIn in about an hour.
      </p>
      <p className="lede muted">One price, thirty-five dollars. No subscription.</p>

      <UploadForm authed={!!session} initialEmail={session?.email ?? ''} />
    </main>
  );
}
