import { pathToFileURL } from 'node:url';

/**
 * Loads an app's impact.config.mjs and returns one tool's section merged over the shared keys
 * (name, root), so each tool reads `config.<key>` without caring about the others.
 */
export async function loadConfig(path, section) {
  const {
    flow,
    static: _static,
    feature,
    ...shared
  } = (await import(pathToFileURL(path).href)).default;
  const chosen = { flow, static: _static, feature }[section];
  if (!chosen) throw new Error(`${path} has no "${section}" section`);
  return { ...shared, ...chosen };
}
