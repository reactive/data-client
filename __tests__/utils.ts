export function mockEventHandlers() {
  const eventMap: {
    [k: string]: Set<EventListener>;
  } = {};
  window.addEventListener = jest.fn((event, cb) => {
    if (!(event in eventMap)) {
      eventMap[event] = new Set();
    }
    eventMap[event].add(cb as any);
  });
  window.removeEventListener = jest.fn((event, cb) => {
    if (event in eventMap) {
      eventMap[event].delete(cb as any);
    }
  });
  const triggerEvent = (name: string, event: Event) => {
    if (eventMap[name] === undefined) return;
    for (const cb of eventMap[name]) {
      cb(event);
    }
  };
  return triggerEvent;
}

export function createEntityMeta(
  entities: Record<string, Record<string, any>>,
) {
  const entityMeta: any = {};
  for (const k in entities) {
    entityMeta[k] = {};
    for (const pk in entities[k]) {
      entityMeta[k][pk] = { date: 0, expiresAt: 0 };
    }
  }
  return entityMeta;
}
