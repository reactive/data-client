import { sampleSpring, springAt, springEasing, SAMPLE_RATE } from '../spring';

const smooth = { duration: 0.4, bounce: 0.15 };
const critical = { duration: 0.4, bounce: 0 };

describe('springAt', () => {
  it.each([smooth, critical])('starts where it is told (%o)', spring => {
    expect(springAt(spring, { offset: 100, velocity: -50 }, 0)).toEqual({
      offset: 100,
      velocity: -50,
    });
  });

  it.each([smooth, critical])(
    'velocity is the derivative of offset (%o)',
    spring => {
      const start = { offset: 80, velocity: 300 };
      const h = 1e-6;
      for (const t of [0.05, 0.13, 0.3]) {
        const numeric =
          (springAt(spring, start, t + h).offset -
            springAt(spring, start, t - h).offset) /
          (2 * h);
        expect(springAt(spring, start, t).velocity).toBeCloseTo(numeric, 3);
      }
    },
  );

  it('critically damped never overshoots from rest', () => {
    const samples = sampleSpring(critical, { offset: 1, velocity: 0 }, 1e-4);
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
  });

  it('bounce overshoots', () => {
    const samples = sampleSpring(smooth, { offset: 1, velocity: 0 }, 1e-4);
    expect(Math.min(...samples)).toBeLessThan(0);
  });

  it('carries momentum: a moving start keeps going before returning', () => {
    const { offset } = springAt(smooth, { offset: 0, velocity: 500 }, 0.05);
    expect(offset).toBeGreaterThan(0);
  });
});

describe('sampleSpring', () => {
  it('ends exactly at the target after roughly the visual duration', () => {
    const samples = sampleSpring(smooth, { offset: 300, velocity: 0 }, 0.25);
    expect(samples[0]).toBe(300);
    expect(samples.at(-1)).toBe(0);
    const seconds = (samples.length - 1) / SAMPLE_RATE;
    expect(seconds).toBeGreaterThan(smooth.duration);
    expect(seconds).toBeLessThan(smooth.duration * 2);
  });

  it('is a single frame when already at rest', () => {
    expect(sampleSpring(smooth, { offset: 0, velocity: 0 }, 0.25)).toEqual([
      0, 0,
    ]);
  });
});

describe('springEasing', () => {
  it('is a CSS linear() from 0 to 1', () => {
    const { easing, duration } = springEasing(smooth);
    expect(easing).toMatch(/^linear\(0, .*, 1\)$/);
    expect(duration).toBeGreaterThan(400);
  });
});
