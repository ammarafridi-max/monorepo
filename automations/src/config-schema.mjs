/**
 * Every target is validated the moment it loads, the same way brand configs are
 * in packages/shared/config. A target that is missing a field fails here with the
 * list of what is wrong, rather than at 05:00 in a cron with a TypeError.
 */

/** Required of every target, whatever jobs it runs. */
const REQUIRED = {
  key: 'string',
  name: 'string',
};

/** Required only of targets that run a given job. Keyed by job name. */
const REQUIRED_BY_JOB = {
  'blog-generate': {
    backendUrl: 'string',
    siteUrl: 'string',
    adminEmailEnv: 'string',
    adminPasswordEnv: 'string',
    ctaClass: 'string',
    writerIdentity: 'string',
    blogUrl: 'function',
    adminBlogUrl: 'function',
  },
  'blog-schedule': {
    backendUrl: 'string',
  },
};

/** Optional, but if present must be the right shape. Catches silent drift. */
const OPTIONAL = {
  citationDomains: 'array',
  allowedLinkPrefixes: 'array',
  forbiddenLinkPatterns: 'array',
  excludedTags: 'array',
  contentChecks: 'array',
  formatsByTier: 'object',
  internalLinkingRule: 'string',
  linkFormatRule: 'string',
  ctaRules: 'string',
  model: 'string',
};

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

export function validateTarget(target, { job = null } = {}) {
  const errors = [];
  const check = (field, want) => {
    const got = typeOf(target[field]);
    if (got === 'undefined') errors.push(`missing: ${field} (${want})`);
    else if (got !== want) errors.push(`${field} should be ${want}, got ${got}`);
  };

  for (const [field, want] of Object.entries(REQUIRED)) check(field, want);
  if (job && REQUIRED_BY_JOB[job]) {
    for (const [field, want] of Object.entries(REQUIRED_BY_JOB[job])) check(field, want);
  }
  for (const [field, want] of Object.entries(OPTIONAL)) {
    if (target[field] !== undefined && typeOf(target[field]) !== want) {
      errors.push(`${field} should be ${want}, got ${typeOf(target[field])}`);
    }
  }

  if (errors.length) {
    throw new Error(
      `Invalid target config "${target.key ?? '(unknown)'}"${job ? ` for job ${job}` : ''}:\n` +
        errors.map((e) => `  - ${e}`).join('\n'),
    );
  }
  return target;
}

export { REQUIRED, REQUIRED_BY_JOB, OPTIONAL };
