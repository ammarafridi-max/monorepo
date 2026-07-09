import AuthForm from '../AuthForm';

export const metadata = { title: 'Log in. Headliner' };

export default function LoginPage() {
  return (
    <main className="wrap">
      <h1 className="display">Welcome back.</h1>
      <p className="lede muted">Log in to see your past headshots.</p>
      <AuthForm mode="login" />
      <p className="formnote" style={{ textAlign: 'left', marginTop: 20 }}>
        New here? <a href="/signup">Create an account</a>. You do not need one to buy.
      </p>
    </main>
  );
}
