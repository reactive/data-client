import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

if (ExecutionEnvironment.canUseDOM) {
  // compensate for bug in docusaurus 3 devmode
  if (!window.gtag) {
    window.gtag = (...args) => {
      console.info(args);
    };
  }
}
