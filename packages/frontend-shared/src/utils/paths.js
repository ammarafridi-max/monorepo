
function normalise(path) {
  if (typeof path !== "string" || !path) return "";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function isUnderPath(pathname, base) {
  const p = normalise(pathname);
  const b = normalise(base);
  if (!p || !b) return false;
  return p === b || p.startsWith(`${b}/`);
}

export function isNavItemActive(pathname, href, exact = false) {
  return exact ? normalise(pathname) === normalise(href) : isUnderPath(pathname, href);
}
