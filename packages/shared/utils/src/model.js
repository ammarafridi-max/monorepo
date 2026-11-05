export function getOrRegisterModel(db, name, schema) {
  try {
    return db.model(name);
  } catch {
    return db.model(name, schema);
  }
}
