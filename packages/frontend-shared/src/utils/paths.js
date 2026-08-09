/**
 * Path matching that respects segment boundaries.
 *
 * A raw `pathname.startsWith(href)` treats "/admin/blog" as a prefix of
 * "/admin/blog-tags", which lights up both sidebar links and makes any
 * prefix-based rule match sibling routes it was never meant to cover.
 */

function normalise(path) {
  if (typeof path !== "string" || !path) return "";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * True when `pathname` is `base` itself or sits underneath it.
 *
 * "/admin/blog"       matches "/admin/blog"        -> true
 * "/admin/blog/new"   matches "/admin/blog"        -> true
 * "/admin/blog-tags"  matches "/admin/blog"        -> false
 */
export function isUnderPath(pathname, base) {
  const p = normalise(pathname);
  const b = normalise(base);
  if (!p || !b) return false;
  return p === b || p.startsWith(`${b}/`);
}

/** Sidebar helper: `exact` items must match the path outright. */
export function isNavItemActive(pathname, href, exact = false) {
  return exact ? normalise(pathname) === normalise(href) : isUnderPath(pathname, href);
}
