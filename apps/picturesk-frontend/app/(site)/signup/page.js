import AuthForm from '../../../components/AuthForm';
import SocialButtons from '../../../components/SocialButtons';
import Container from '../../../components/Container';

export const metadata = { title: 'Create your account. Picturesk.ai', robots: { index: false, follow: false } };

export default function SignupPage() {
  return (
    <main className="page">
      <Container size="narrow">
        <h1 className="display">Create your account.</h1>
        <p className="lede muted">
          Keep your orders in one place. It is optional and free, and buying never needs it.
        </p>
        <SocialButtons />
        <AuthForm mode="signup" />
        <p className="formnote" style={{ textAlign: 'left', marginTop: 20 }}>
          Already have an account? <a href="/login">Log in</a>.
        </p>
      </Container>
    </main>
  );
}
