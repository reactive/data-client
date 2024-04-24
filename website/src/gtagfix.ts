import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

if (ExecutionEnvironment.canUseDOM) {
  // compensate for bug in docusaurus 3 devmode
  if (!window.gtag) {
    window.gtag = (...args) => {
      console.info(args);
    };
  }
  // fix devmode webpack bug
  if (!('installedCssChunks' in window)) window.installedCssChunks = {};
}
