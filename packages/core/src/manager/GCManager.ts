import type { GCAction } from '../actions.js';
import { REF } from '../actionTypes.js';
import { GC } from '../actionTypes.js';
import Controller from '../controller/Controller.js';
import type { Manager, Middleware } from '../types.js';

export default class GCManager implements Manager {
  protected endpointCount: Record<string, number> = {};
  protected entityCount: Record<string, Record<string, number>> = {};
  protected endpoints = new Set<string>();
  protected entities: GCAction['entities'] = [];
  declare protected intervalId: ReturnType<typeof setInterval>;
  declare protected controller: Controller;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      if (action.type === REF) {
        const { key, paths, incr } = action;
        if (incr) {
          this.endpointCount[key]++;
          paths.forEach(path => {
            if (!(path.key in this.endpointCount)) {
              this.entityCount[path.key] = {};
            }
            this.entityCount[path.key][path.pk]++;
          });
        } else {
          if (this.endpointCount[key]-- <= 0) {
            // queue for cleanup
            this.endpoints.add(key);
            this.entities.concat(...paths);
          }
          paths.forEach(path => {
            if (!(path.key in this.endpointCount)) {
              return;
            }
            this.entityCount[path.key][path.pk]--;
          });
        }
        return Promise.resolve();
      }
      return next(action);
    };
  };

  init() {
    this.intervalId = setInterval(
      () => {
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => this.runSweep(), { timeout: 1000 });
        } else {
          this.runSweep();
        }
      },
      // every 5 min
      60 * 1000 * 5,
    );
  }

  cleanup() {
    clearInterval(this.intervalId);
  }

  protected runSweep() {
    const state = this.controller.getState();
    const entities: GCAction['entities'] = [];
    const endpoints: string[] = [];
    const now = Date.now();
    for (const key of this.endpoints) {
      const expiresAt = state.meta[key]?.expiresAt ?? 0;
      if (expiresAt > now) {
        endpoints.push(key);
      }
    }
    for (const path of this.entities) {
      const expiresAt = state.entityMeta[path.key]?.[path.pk]?.expiresAt ?? 0;
      if (expiresAt > now) {
        entities.push(path);
      }
    }
    this.controller.dispatch({
      type: GC,
      entities,
      endpoints,
    });
  }
}
