import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaLinkedin } from 'react-icons/fa6';
import { configuredProviders } from '../lib/oauth';

const ICONS = { google: FcGoogle, facebook: FaFacebook, linkedin: FaLinkedin };

export default function SocialButtons({ next = '/account' }) {
  const providers = configuredProviders();
  if (providers.length === 0) return null;
  const qs = `?next=${encodeURIComponent(next)}`;

  return (
    <div className="social">
      {providers.map((p) => {
        const Icon = ICONS[p.name];
        return (
          <a key={p.name} className="social__btn" href={`/api/auth/oauth/${p.name}${qs}`}>
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
