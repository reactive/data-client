window.requestIdleCallback = jest.fn().mockImplementation(cb => {
  cb();
});
