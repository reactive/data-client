export abstract class Mergeable {
  declare key: string;

  /** Return true to merge incoming data; false keeps existing entity
   *
   * @see https://dataclient.io/rest/api/Entity#shouldUpdate
   */
  shouldUpdate(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return true;
  }

  /** Determines the order of incoming entity vs entity already in store\
   *
   * @see https://dataclient.io/rest/api/Entity#shouldReorder
   * @returns true if incoming entity should be first argument of merge()
   */
  shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return incomingMeta.fetchedAt < existingMeta.fetchedAt;
  }

  /** Creates new instance copying over defined values of arguments
   *
   * @see https://dataclient.io/rest/api/Entity#merge
   */
  abstract merge(existing: any, incoming: any): any;

  /** Run when an existing entity is found in the store
   *
   * @see https://dataclient.io/rest/api/Entity#mergeWithStore
   */
  mergeWithStore(
    existingMeta: {
      date: number;
      fetchedAt: number;
    },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    const shouldUpdate = this.shouldUpdate(
      existingMeta,
      incomingMeta,
      existing,
      incoming,
    );

    if (shouldUpdate) {
      // distinct types are not mergeable (like delete symbol), so just replace
      if (typeof incoming !== typeof existing) {
        return incoming;
      } else {
        return (
            this.shouldReorder(existingMeta, incomingMeta, existing, incoming)
          ) ?
            this.merge(incoming, existing)
          : this.merge(existing, incoming);
      }
    } else {
      return existing;
    }
  }

  /** Run when an existing entity is found in the store
   *
   * @see https://dataclient.io/rest/api/Entity#mergeMetaWithStore
   */
  mergeMetaWithStore(
    existingMeta: {
      fetchedAt: number;
      date: number;
      expiresAt: number;
    },
    incomingMeta: { fetchedAt: number; date: number; expiresAt: number },
    existing: any,
    incoming: any,
  ) {
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming) ?
        existingMeta
      : incomingMeta;
  }
}
