/** Paths and URLs shared by the docs-to-markdown tools; no heavy imports */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
export const SITE = 'https://dataclient.io';
/** Repo-relative path with forward slashes */
export const rel = file => path.relative(ROOT, file).split(path.sep).join('/');
