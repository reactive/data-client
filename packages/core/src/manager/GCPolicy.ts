import type { EntityPath } from '@data-client/normalizr';

import { GC } from '../actionTypes.js';
import Controller from '../controller/Controller.js';

export default class GCPolicy {
  protected endpointCount: Record<string, number> = {};
  protected entityCount: Record<string, Record<string, number>> = {};
  protected endpoints = new Set<string>();
  protected entities: EntityPath[] = [];
  declare protected intervalId: ReturnType<typeof setInterval>;
  declare protected controller: Controller;
  declare protected options: GCOptions;

  constructor(
    controller: Controller,
    // every 5 min
    { intervalMS = 60 * 1000 * 5 }: GCOptions = {},
  ) {
    this.controller = controller;
    this.options = { intervalMS };
  }

  createCountRef({ key, paths = [] }: { key: string; paths?: EntityPath[] }) {
    if (!ENV_DYNAMIC) return () => () => undefined;
    // increment
    return () => {
      this.endpointCount[key]++;
      paths.forEach(path => {
        if (!(path.key in this.endpointCount)) {
          this.entityCount[path.key] = {};
        }
        this.entityCount[path.key][path.pk]++;
      });

      // decrement
      return () => {
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
      };
    };
  }

  init() {
    // don't run this in nodejs env
    if (ENV_DYNAMIC)
      this.intervalId = setInterval(() => {
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => this.runSweep(), { timeout: 1000 });
        } else {
          this.runSweep();
        }
      }, this.options.intervalMS);
  }

  cleanup() {
    clearInterval(this.intervalId);
  }

  protected runSweep() {
    const state = this.controller.getState();
    const entities: EntityPath[] = [];
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

export interface GCOptions {
  intervalMS?: number;
}

const ENV_DYNAMIC =
  typeof navigator !== 'undefined' || typeof window !== 'undefined';
