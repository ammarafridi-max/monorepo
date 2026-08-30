import AuthForm from '../../../components/AuthForm';
import SocialButtons from '../../../components/SocialButtons';

export const metadata = { title: 'Log in. Picturesk.ai', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }) {
  // Set when a social sign-in bounced back without a session (denied, expired, or
  // a state mismatch). One calm, generic line, no detail about which step failed.
  const failed = Boolean((await searchParams)?.error);

  return (
    <main className="wrap">
      <h1 className="display">Welcome back.</h1>
      <p className="lede muted">Log in to see your past headshots.</p>
      {failed && (
        <p className="error">We could not sign you in. Please try again.</p>
      )}
      <SocialButtons />
      <AuthForm mode="login" />
      <p className="formnote" style={{ textAlign: 'left', marginTop: 20 }}>
        New here? <a href="/signup">Create an account</a>. You do not need one to buy.
      </p>
    </main>
  );
}
