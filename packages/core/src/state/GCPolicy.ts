import type { EntityPath } from '@data-client/normalizr';

import { GC } from '../actionTypes.js';
import Controller from '../controller/Controller.js';

export class GCPolicy implements GCInterface {
  protected endpointCount: Record<string, number> = Object.create(null);
  protected entityCount: Record<string, Record<string, number>> =
    Object.create(null);

  protected endpoints = new Set<string>();
  protected entities: EntityPath[] = [];
  declare protected intervalId: ReturnType<typeof setInterval>;
  declare protected controller: Controller;
  declare protected options: GCOptions;

  constructor(
    // every 5 min
    { intervalMS = 60 * 1000 * 5 }: GCOptions = {},
  ) {
    this.options = { intervalMS };
  }

  init(controller: Controller) {
    this.controller = controller;

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

  createCountRef({ key, paths = [] }: { key: string; paths?: EntityPath[] }) {
    // increment
    return () => {
      this.endpointCount[key]++;
      paths.forEach(path => {
        if (!(path.key in this.entityCount)) {
          this.entityCount[path.key] = Object.create(null);
        }
        this.entityCount[path.key][path.pk]++;
      });

      // decrement
      return () => {
        if (this.endpointCount[key]-- <= 0) {
          // queue for cleanup
          this.endpoints.add(key);
        }
        paths.forEach(path => {
          if (!(path.key in this.endpointCount)) {
            return;
          }
          if (this.entityCount[path.key][path.pk]-- <= 0) {
            // queue for cleanup
            this.entities.concat(...paths);
          }
        });
      };
    };
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
export interface CreateCountRef {
  ({ key, paths }: { key: string; paths?: EntityPath[] }): () => () => void;
}
export interface GCInterface {
  createCountRef: CreateCountRef;
}
