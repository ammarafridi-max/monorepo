
const REQUIRED = {
  key: 'string',
  name: 'string',
};

const REQUIRED_BY_JOB = {
  'affiliate-payouts': {
    backendUrl: 'string',
    adminEmailEnv: 'string',
    adminPasswordEnv: 'string',
  },
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
    blogSchedule: 'object',
  },
};

const OPTIONAL = {
  jobs: 'array',
  citationDomains: 'array',
  allowedLinkPrefixes: 'array',
  forbiddenLinkPatterns: 'array',
  excludedTags: 'array',
  contentChecks: 'array',
  titleChecks: 'array',
  formatsByTier: 'object',
  blogSchedule: 'object',
  internalLinkingRule: 'string',
  linkFormatRule: 'string',
  ctaRules: 'string',
  model: 'string',
  imagePrompt: 'function',
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

  const participates = !Array.isArray(target.jobs) || !job || target.jobs.includes(job);

  for (const [field, want] of Object.entries(REQUIRED)) check(field, want);
  if (job && participates && REQUIRED_BY_JOB[job]) {
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
