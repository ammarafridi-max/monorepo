export function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}
