import AuthForm from '../../../components/AuthForm';
import SocialButtons from '../../../components/SocialButtons';
import Container from '../../../components/Container';
import { safeNext } from '../../../lib/redirects';

export const metadata = { title: 'Log in. Picturesk.ai', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }) {
  // Set when a social sign-in bounced back without a session (denied, expired, or
  // a state mismatch). One calm, generic line, no detail about which step failed.
  const params = await searchParams;
  const failed = Boolean(params?.error);
  const next = safeNext(params?.next);

  return (
    <main className="page">
      <Container size="narrow">
        <h1 className="display">Welcome back.</h1>
        <p className="lede muted">Log in to your sets and your trained model.</p>
        {failed && (
          <p className="error">We could not sign you in. Please try again.</p>
        )}
        <SocialButtons next={next} />
        <AuthForm mode="login" next={next} />
        <p className="formnote" style={{ textAlign: 'left', marginTop: 20 }}>
          New here? <a href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</a>.
        </p>
      </Container>
    </main>
  );
}
