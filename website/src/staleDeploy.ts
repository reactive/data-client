import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';
import { useEffect } from 'react';

const BUILD_ID_URL = `${siteConfig.baseUrl}build-id.txt`;
/** A build's id: its runtime chunk's file name (build-id-plugin.js) */
const BUILD_ID = /^runtime~main\.\w+\.js$/;
/** The build this tab is running */
const runningId =
  ExecutionEnvironment.canUseDOM ?
    Array.from(document.scripts, script => script.src.split('/').pop()).find(
      name => name && BUILD_ID.test(name),
    )
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

/** The build now deployed, or undefined when the answer isn't a build id
 * (a captive portal or fallback page answering instead) */
async function fetchDeployedId(): Promise<string | undefined> {
  const res = await fetch(BUILD_ID_URL, {
    cache: 'no-store',
    // a hung request would block every later check
    signal: AbortSignal.timeout(10_000),
  });
  const id = res.ok ? (await res.text()).trim() : '';
  return BUILD_ID.test(id) ? id : undefined;
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
    const deployedId = await fetchDeployedId();
    if (
      !deployedId ||
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
