const isBlank = (value) => value == null || value === '';

const readPath = (source, path) =>
  path.split('.').reduce((value, key) => (value == null ? value : value[key]), source);

export function missingEnvKeys(config, required) {
  const entries = Array.isArray(required)
    ? required.map((path) => [path, path])
    : Object.entries(required);
  return entries.filter(([path]) => isBlank(readPath(config, path))).map(([, name]) => name);
}

export function requireEnv(config, required) {
  const missing = missingEnvKeys(config, required);
  if (missing.length) {
    throw new Error(`missing required environment variable(s): ${missing.join(', ')}`);
  }
}
