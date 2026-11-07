import { pathToFileURL } from 'node:url';

/**
 * Loads an app's impact.config.mjs and returns one tool's section merged over the shared keys
 * (name, root), so each tool reads `config.<key>` without caring about the others.
 */
export async function loadConfig(path, section) {
  const all = (await import(pathToFileURL(path).href)).default;
  const { flow, static: stat, feature, ...shared } = all;
  const sections = { flow, static: stat, feature };
  if (!sections[section])
    throw new Error(`${path} has no "${section}" section`);
  return { ...shared, ...sections[section] };
}
