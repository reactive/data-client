export type FetchPromise = Promise<any> & { resolved: boolean };

export const RESOLVED = Object.assign(Promise.resolve(), {
  resolved: true,
}) as FetchPromise;

export function trackPromise(promise: Promise<any>): FetchPromise {
  const p = promise as FetchPromise;
  p.resolved = false;
  const r = () => {
    p.resolved = true;
  };
  p.then(r, r);
  return p;
}
