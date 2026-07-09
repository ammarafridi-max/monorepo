import AuthForm from '../AuthForm';
import SocialButtons from '../SocialButtons';

export const metadata = { title: 'Create your account. Headliner' };

export default function SignupPage() {
  return (
    <main className="wrap">
      <h1 className="display">Create your account.</h1>
      <p className="lede muted">
        Keep your orders in one place. It is optional and free, and buying never needs it.
      </p>
      <SocialButtons />
      <AuthForm mode="signup" />
      <p className="formnote" style={{ textAlign: 'left', marginTop: 20 }}>
        Already have an account? <a href="/login">Log in</a>.
      </p>
    </main>
  );
}
