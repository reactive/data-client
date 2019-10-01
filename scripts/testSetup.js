require('core-js/stable');
window.requestIdleCallback = jest.fn().mockImplementation(cb => {
  cb();
});
