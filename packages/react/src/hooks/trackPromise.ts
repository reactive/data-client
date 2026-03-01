export type UsablePromise<T = any> = PromiseLike<T> & { resolved: boolean };

export function createFulfilled<T>(value: T): UsablePromise<T> {
  return {
    status: 'fulfilled',
    value,
    resolved: true,
    then(
      onfulfilled?: ((value: T) => any) | null,
      onrejected?: ((reason: any) => any) | null,
    ) {
      return Promise.resolve(value).then(onfulfilled, onrejected);
    },
  } as any;
}

export function createRejected(reason: any): UsablePromise<never> {
  return {
    status: 'rejected',
    reason,
    resolved: true,
    then(
      onfulfilled?: ((value: never) => any) | null,
      onrejected?: ((reason: any) => any) | null,
    ) {
      return Promise.reject(reason).then(onfulfilled, onrejected);
    },
  } as any;
}
