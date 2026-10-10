import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';
import { useEffect } from 'react';

const BUILD_ID_URL = `${siteConfig.baseUrl}build-id.txt`;
/** The build this tab is running: its runtime chunk's name (build-id-plugin.js) */
const runningId =
  ExecutionEnvironment.canUseDOM ?
    document
      .querySelector<HTMLScriptElement>('script[src*="/runtime~main."]')
      ?.src.split('/')
      .pop()
  : undefined;
/** Deploy last reloaded for, so a reload still served the old build can't loop */
const RELOADED_KEY = 'staleDeployReloadedFor';

/** A JS or CSS chunk failed to load (webpack/Rspack runtime errors) */
function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ChunkLoadError' ||
      (error as { code?: unknown }).code === 'CSS_CHUNK_LOAD_FAILED')
  );
}

let checking = false;

/** Reloads the page when `error` is a chunk that failed to load because a newer
 * build has deployed since this tab loaded (its hashed chunks replaced ours).
 * Anything else (offline, flaky network, a bug in the live build) is left to
 * the normal error handling. */
async function reloadIfStaleDeploy(error: unknown): Promise<void> {
  if (checking || !runningId || !isChunkLoadError(error)) return;
  checking = true;
  try {
    const res = await fetch(BUILD_ID_URL, {
      cache: 'no-store',
      // a hung request would block every later check
      signal: AbortSignal.timeout(10_000),
    });
    const deployedId = res.ok && (await res.text()).trim();
    if (
      // not our file (a captive portal or fallback page answering instead)
      !deployedId ||
      !/^runtime~main\.\w+\.js$/.test(deployedId) ||
      deployedId === runningId ||
      sessionStorage.getItem(RELOADED_KEY) === deployedId
    )
      return;
    sessionStorage.setItem(RELOADED_KEY, deployedId);
    window.location.reload();
  } catch {
    // can't confirm a new deploy (offline, storage blocked): don't reload
  } finally {
    checking = false;
  }
}

/** For error boundary fallbacks: `error` already crashed the page, so reloading
 * onto the new deploy loses nothing */
export function useReloadIfStaleDeploy(error: Error): void {
  useEffect(() => {
    reloadIfStaleDeploy(error);
  }, [error]);
}

if (ExecutionEnvironment.canUseDOM) {
  // Uncaught chunk failures before React mounts leave a dead page (the route
  // preload in @docusaurus/core's clientEntry). Once hydrated (Docusaurus sets
  // <html data-has-hydrated="true">), an uncaught one (link hover
  // preloads) leaves a working page that a reload could lose state from.
  window.addEventListener('unhandledrejection', event => {
    if (document.documentElement.dataset.hasHydrated !== 'true')
      reloadIfStaleDeploy(event.reason);
  });
}
