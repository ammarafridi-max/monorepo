import AuthForm from '../../../components/AuthForm';
import SocialButtons from '../../../components/SocialButtons';
import Container from '../../../components/Container';
import { safeNext } from '../../../lib/redirects';

export const metadata = { title: 'Create your account. Picturesk.ai', robots: { index: false, follow: false } };

export default async function SignupPage({ searchParams }) {
  const next = safeNext((await searchParams)?.next);
  const intoFunnel = next !== '/account';
  return (
    <main className="page">
      <Container size="narrow">
        <h1 className="display">Create your account.</h1>
        <p className="lede muted">
          {intoFunnel
            ? 'Your account keeps the model we train on your face, so every set after the first is faster and cheaper. Free, and your first set is on us.'
            : 'Keep your orders and your trained model in one place. Free, and your first set is on us.'}
        </p>
        <SocialButtons next={next} />
        <AuthForm mode="signup" next={next} />
        <p className="formnote" style={{ textAlign: 'left', marginTop: 20 }}>
          Already have an account? <a href={`/login?next=${encodeURIComponent(next)}`}>Log in</a>.
        </p>
      </Container>
    </main>
  );
}
