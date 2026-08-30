import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaLinkedin } from 'react-icons/fa6';
import { configuredProviders } from '../lib/oauth';

// Brand marks, keyed by provider name. Google uses its official multicolor "G"
// (Google's brand rules expect the official mark, so it is the accepted exception
// to our single-accent palette); the others use their brand glyph, which inherits
// currentColor and so renders in --ink, staying within the aesthetic.
const ICONS = { google: FcGoogle, facebook: FaFacebook, linkedin: FaLinkedin };

// Social sign-in options for /login and /signup. Shown only for providers that
// are actually configured (id + secret present), so a half-configured deploy
// never offers a button that cannot work. Each is a plain link to the start
// route; buying stays anonymous, this only adds another way into the account.
export default function SocialButtons() {
  const providers = configuredProviders();
  if (providers.length === 0) return null;

  return (
    <div className="social">
      {providers.map((p) => {
        const Icon = ICONS[p.name];
        return (
          <a key={p.name} className="social__btn" href={`/api/auth/oauth/${p.name}`}>
            {Icon && <Icon className="social__icon" aria-hidden="true" />}
            Continue with {p.label}
          </a>
        );
      })}
      <div className="divider">
        <span>or</span>
      </div>
    </div>
  );
}
