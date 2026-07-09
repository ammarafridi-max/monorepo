import { configuredProviders } from '../lib/oauth';

// Social sign-in options for /login and /signup. Shown only for providers that
// are actually configured (id + secret present), so a half-configured deploy
// never offers a button that cannot work. Each is a plain link to the start
// route; buying stays anonymous, this only adds another way into the account.
export default function SocialButtons() {
  const providers = configuredProviders();
  if (providers.length === 0) return null;

  return (
    <div className="social">
      {providers.map((p) => (
        <a key={p.name} className="social__btn" href={`/api/auth/oauth/${p.name}`}>
          Continue with {p.label}
        </a>
      ))}
      <div className="divider">
        <span>or</span>
      </div>
    </div>
  );
}
