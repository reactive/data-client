import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    installedCssChunks?: Record<string, unknown>;
  }
}

if (ExecutionEnvironment.canUseDOM) {
  // compensate for bug in docusaurus 3 devmode
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      console.info(args);
    };
  }
  // fix devmode webpack bug
  if (!('installedCssChunks' in window)) window.installedCssChunks = {};
}
