export function flagValue(argv, name, fallback = null) {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : fallback;
}

export function hasFlag(argv, ...names) {
  return names.some((name) => argv.includes(`--${name}`));
}
