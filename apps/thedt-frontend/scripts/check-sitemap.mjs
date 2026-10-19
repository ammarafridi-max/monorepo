// Usage: node scripts/check-sitemap.mjs
// Fails the build when a public page route is absent from the sitemap's static list.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app');
const SITEMAP = join(APP_DIR, 'sitemap.js');

const EXCLUDED_PREFIXES = ['/admin', '/booking', '/insurance-booking'];

function pageRoutes(dir, base = '') {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const segment = entry.startsWith('(') && entry.endsWith(')') ? '' : `/${entry}`;
      found.push(...pageRoutes(full, base + segment));
    } else if (entry === 'page.js' || entry === 'page.jsx') {
      found.push(base || '/');
    }
  }
  return found;
}

const routes = pageRoutes(APP_DIR)
  .filter((r) => !r.includes('['))
  .filter((r) => !EXCLUDED_PREFIXES.some((p) => r === p || r.startsWith(`${p}/`)));

const sitemapSource = readFileSync(SITEMAP, 'utf8');
const listed = new Set([...sitemapSource.matchAll(/url:\s*'([^']+)'/g)].map((m) => m[1]));

const missing = routes.filter((r) => !listed.has(r)).sort();

if (missing.length) {
  console.error(`\nsitemap.js is missing ${missing.length} public route(s):\n`);
  for (const r of missing) console.error(`  ${r}`);
  console.error(`\nAdd them to staticPages in ${relative(process.cwd(), SITEMAP)}, or add the prefix to EXCLUDED_PREFIXES if the route should stay out of the sitemap.\n`);
  process.exit(1);
}

console.log(`sitemap check: ${routes.length} public routes, all present`);
