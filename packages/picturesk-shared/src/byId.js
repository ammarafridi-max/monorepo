export function byId(list) {
  return Object.freeze(Object.fromEntries(list.map((item) => [item.id, item])));
}

export function hasId(map) {
  return (id) => Object.prototype.hasOwnProperty.call(map, id);
}
