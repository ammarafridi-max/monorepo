import { createHash } from 'crypto';

// Pass express-rate-limit's own ipKeyGenerator: it normalizes IPv6 and its name satisfies the library's keyGenerator validation.
export function sessionAwareRateLimitKey(ipKeyGenerator) {
  return (req) => {
    const token = req.cookies?.jwt;
    if (token && token !== 'loggedout') {
      return `s:${createHash('sha256').update(token).digest('hex').slice(0, 32)}`;
    }
    return ipKeyGenerator(req.ip || 'unknown');
  };
}
