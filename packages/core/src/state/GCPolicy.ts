import type { EntityPath } from '@data-client/normalizr';

import { GC } from '../actionTypes.js';
import Controller from '../controller/Controller.js';

export class GCPolicy implements GCInterface {
  protected endpointCount = new Map<string, number>();
  protected entityCount = new Map<string, Map<string, number>>();
  protected endpointsQ = new Set<string>();
  protected entitiesQ: EntityPath[] = [];

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
        /* TODO: React native
          import { InteractionManager } from 'react-native';
          InteractionManager.runAfterInteractions(callback);
          if (options?.timeout) {
            InteractionManager.setDeadline(options.timeout);
          }
        */
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
      this.endpointCount.set(key, (this.endpointCount.get(key) ?? 0) + 1);
      paths.forEach(path => {
        if (!this.entityCount.has(path.key)) {
          this.entityCount.set(path.key, new Map<string, number>());
        }
        const instanceCount = this.entityCount.get(path.key)!;
        instanceCount.set(path.pk, (instanceCount.get(path.pk) ?? 0) + 1);
      });

      // decrement
      return () => {
        const currentCount = this.endpointCount.get(key)!;
        if (currentCount !== undefined) {
          if (currentCount <= 1) {
            this.endpointCount.delete(key);
            // queue for cleanup
            this.endpointsQ.add(key);
          } else {
            this.endpointCount.set(key, currentCount - 1);
          }
        }
        paths.forEach(path => {
          if (!this.entityCount.has(path.key)) {
            return;
          }
          const instanceCount = this.entityCount.get(path.key)!;
          const entityCount = instanceCount.get(path.pk)!;
          if (entityCount !== undefined) {
            if (entityCount <= 1) {
              instanceCount.delete(path.pk);
              // queue for cleanup
              this.entitiesQ.push(path);
            } else {
              instanceCount.set(path.pk, entityCount - 1);
            }
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

    const nextEndpointsQ = new Set<string>();
    for (const key of this.endpointsQ) {
      const expiresAt = state.meta[key]?.expiresAt ?? 0;
      if (expiresAt < now && !this.endpointCount.has(key)) {
        endpoints.push(key);
      } else {
        nextEndpointsQ.add(key);
      }
    }
    this.endpointsQ = nextEndpointsQ;

    const nextEntitiesQ: EntityPath[] = [];
    for (const path of this.entitiesQ) {
      const expiresAt = state.entityMeta[path.key]?.[path.pk]?.expiresAt ?? 0;
      if (expiresAt < now && !this.entityCount.get(path.key)?.has(path.pk)) {
        entities.push(path);
      } else {
        nextEntitiesQ.push(path);
      }
    }
    this.entitiesQ = nextEntitiesQ;

    if (entities.length || endpoints.length) {
      this.controller.dispatch({ type: GC, entities, endpoints });
    }
  }
}

export class ImmortalGCPolicy implements GCInterface {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  init() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  cleanup() {}
  createCountRef() {
    return () => () => undefined;
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
  init(controller: Controller): void;
  cleanup(): void;
}
