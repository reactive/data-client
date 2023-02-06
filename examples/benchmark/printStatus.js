export function printStatus(fn) {
  var name = fn.name;
  const status = %GetOptimizationStatus(fn);
  console.error(name, status.toString(2).padStart(12, '0'));

  // based on https://github.com/v8/v8/blob/master/src/runtime/runtime.h#L822
  if (status & (1 << 0)) {
    console.error(" is function");
  }

  if (status & (1 << 1)) {
    console.error(" is never optimized");
  }

  if (status & (1 << 2)) {
    console.error(" is always optimized");
  }

  if (status & (1 << 3)) {
    console.error(" is maybe deoptimized");
  }

  if (status & (1 << 4)) {
    console.error(" is optimized");
  }

  if (status & (1 << 5)) {
    console.error(" is optimized by TurboFan");
  }

  if (status & (1 << 6)) {
    console.error(" is interpreted");
  }

  if (status & (1 << 7)) {
    console.error(" is marked for optimization");
  }

  if (status & (1 << 8)) {
    console.error(" is marked for concurrent optimization");
  }

  if (status & (1 << 9)) {
    console.error(" is optimizing concurrently");
  }

  if (status & (1 << 10)) {
    console.error(" is executing");
  }

  if (status & (1 << 11)) {
    console.error(" topmost frame is turbo fanned");
  }
  if (status & (1 << 12)) {
    console.error(" kLiteMode");
  }
  if (status & (1 << 13)) {
    console.error(" kMarkedForDeoptimization");
  }
  if (status & (1 << 14)) {
    console.error(" kBaseline");
  }
  if (status & (1 << 15)) {
    console.error(" kTopmostFrameIsInterpreted");
  }
  if (status & (1 << 16)) {
    console.error(" kTopmostFrameIsBaseline");
  }
  console.error();
}
