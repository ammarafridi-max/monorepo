export function brandSiteUrl(brand, { www = true } = {}) {
  return `https://${www ? 'www.' : ''}${brand.domain}`;
}
