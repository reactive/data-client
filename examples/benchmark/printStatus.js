// OptimizationStatus bits from V8 12.x src/runtime/runtime.h (Node 22)
const FLAGS = [
  'is function',
  'is never optimized',
  'is always optimized',
  'is maybe deoptimized',
  'is optimized',
  'is optimized by Maglev',
  'is optimized by TurboFan',
  'is interpreted',
  'is marked for optimization',
  'is marked for concurrent optimization',
  'is optimizing concurrently',
  'is executing',
  'topmost frame is TurboFanned',
  'lite mode',
  'is marked for deoptimization',
  'is baseline (Sparkplug)',
  'topmost frame is interpreted',
  'topmost frame is baseline',
  'is lazy',
  'topmost frame is Maglev',
  'optimize on next call optimizes to Maglev',
];

export function printStatus(fn) {
  const status = %GetOptimizationStatus(fn);
  console.error(fn.name, status.toString(2).padStart(FLAGS.length, '0'));
  FLAGS.forEach((label, bit) => {
    if (status & (1 << bit)) console.error(' ' + label);
  });
  console.error();
}
