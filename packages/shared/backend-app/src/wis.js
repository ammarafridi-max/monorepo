export function createWis({ create, config }) {
  return create({
    url: config.wis.url,
    agencyId: config.wis.agencyId,
    agencyCode: config.wis.agencyCode,
    frontendUrl: config.frontendUrl,
  });
}
