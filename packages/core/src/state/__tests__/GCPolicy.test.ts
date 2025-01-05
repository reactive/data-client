import type { EntityPath } from '@data-client/normalizr';
import { jest } from '@jest/globals';

import { GC } from '../../actionTypes';
import Controller from '../../controller/Controller';
import { GCPolicy } from '../GCPolicy';

describe('GCPolicy', () => {
  let gcPolicy: GCPolicy;
  let controller: Controller;

  beforeEach(() => {
    controller = {
      getState: jest.fn(),
      dispatch: jest.fn(),
    } as unknown as Controller;
    gcPolicy = new GCPolicy();
    gcPolicy.init(controller);
  });

  afterEach(() => {
    gcPolicy.cleanup();
  });

  it('should increment and decrement endpoint and entity counts', () => {
    const key = 'testEndpoint';
    const paths: EntityPath[] = [{ key: 'testEntity', pk: '1' }];
    const countRef = gcPolicy.createCountRef({ key, paths });

    const decrement = countRef();
    expect(gcPolicy['endpointCount'].get(key)).toBe(1);
    expect(gcPolicy['entityCount'].get('testEntity')?.get('1')).toBe(1);

    decrement();
    expect(gcPolicy['endpointCount'].get(key)).toBeUndefined();
    expect(gcPolicy['entityCount'].get('testEntity')?.get('1')).toBeUndefined();
  });

  it('should dispatch GC action once no ref counts and is expired', () => {
    const key = 'testEndpoint';
    const paths: EntityPath[] = [{ key: 'testEntity', pk: '1' }];
    const state = {
      meta: { testEndpoint: { expiresAt: Date.now() - 1000 } },
      entityMeta: { testEntity: { '1': { expiresAt: Date.now() - 1000 } } },
    };
    (controller.getState as jest.Mock).mockReturnValue(state);

    const countRef = gcPolicy.createCountRef({ key, paths });

    const decrement = countRef();
    countRef(); // Increment again
    gcPolicy['runSweep']();
    expect(controller.dispatch).not.toHaveBeenCalled();
    decrement();
    gcPolicy['runSweep']();
    expect(controller.dispatch).not.toHaveBeenCalled();
    decrement(); // Decrement twice

    gcPolicy['runSweep']();
    expect(controller.dispatch).toHaveBeenCalledWith({
      type: GC,
      entities: [{ key: 'testEntity', pk: '1' }],
      endpoints: ['testEndpoint'],
    });
  });

  it('should dispatch GC action once no ref counts and is expired with extra decrements', () => {
    const key = 'testEndpoint';
    const paths: EntityPath[] = [{ key: 'testEntity', pk: '1' }];
    const state = {
      meta: { testEndpoint: { expiresAt: Date.now() - 1000 } },
      entityMeta: { testEntity: { '1': { expiresAt: Date.now() - 1000 } } },
    };
    (controller.getState as jest.Mock).mockReturnValue(state);

    const countRef = gcPolicy.createCountRef({ key, paths });

    const decrement = countRef();
    countRef(); // Increment again
    gcPolicy['runSweep']();
    expect(controller.dispatch).not.toHaveBeenCalled();
    decrement();
    gcPolicy['runSweep']();
    expect(controller.dispatch).not.toHaveBeenCalled();
    decrement(); // Decrement twice
    decrement(); // Decrement extra time

    gcPolicy['runSweep']();
    expect(controller.dispatch).toHaveBeenCalledWith({
      type: GC,
      entities: [{ key: 'testEntity', pk: '1' }],
      endpoints: ['testEndpoint'],
    });
  });

  it('should dispatch GC action once no ref counts and no expiry state', () => {
    const key = 'testEndpoint';
    const paths: EntityPath[] = [{ key: 'testEntity', pk: '1' }];
    const state = {
      meta: {},
      entityMeta: {},
    };
    (controller.getState as jest.Mock).mockReturnValue(state);

    const countRef = gcPolicy.createCountRef({ key, paths });

    const decrement = countRef();
    countRef(); // Increment again
    gcPolicy['runSweep']();
    expect(controller.dispatch).not.toHaveBeenCalled();
    decrement();
    gcPolicy['runSweep']();
    expect(controller.dispatch).not.toHaveBeenCalled();
    decrement(); // Decrement twice

    gcPolicy['runSweep']();
    expect(controller.dispatch).toHaveBeenCalledWith({
      type: GC,
      entities: [{ key: 'testEntity', pk: '1' }],
      endpoints: ['testEndpoint'],
    });
  });

  it('should not dispatch GC action if expiresAt has not passed, but dispatch later when it has', () => {
    jest.useFakeTimers();
    const key = 'testEndpoint';
    const paths: EntityPath[] = [{ key: 'testEntity', pk: '1' }];
    const futureTime = Date.now() + 1000;
    const state = {
      meta: { testEndpoint: { expiresAt: futureTime } },
      entityMeta: { testEntity: { '1': { expiresAt: futureTime } } },
    };
    (controller.getState as jest.Mock).mockReturnValue(state);

    const countRef = gcPolicy.createCountRef({ key, paths });

    const decrement = countRef();
    countRef(); // Increment again
    decrement();
    decrement(); // Decrement twice

    gcPolicy['runSweep']();

    expect(controller.dispatch).not.toHaveBeenCalled();

    // Fast forward time to past the futureTime
    jest.advanceTimersByTime(2000);
    (controller.getState as jest.Mock).mockReturnValue({
      meta: { testEndpoint: { expiresAt: Date.now() - 1000 } },
      entityMeta: { testEntity: { '1': { expiresAt: Date.now() - 1000 } } },
    });

    gcPolicy['runSweep']();

    expect(controller.dispatch).toHaveBeenCalledWith({
      type: GC,
      entities: [{ key: 'testEntity', pk: '1' }],
      endpoints: ['testEndpoint'],
    });

    jest.useRealTimers();
  });
});
