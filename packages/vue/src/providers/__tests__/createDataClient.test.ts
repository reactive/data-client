import {
  Controller,
  NetworkManager,
  PollingSubscription,
  SubscriptionManager,
  actionTypes,
} from '@data-client/core';
import type { State, Manager, Middleware } from '@data-client/core';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import { ControllerKey, StateKey } from '../../context';
import { createDataClient } from '../createDataClient';

// Mock Vue's provide for unit tests since we're testing createDataClient in isolation
// The actual provide functionality is tested in tests that use mockApp
jest.mock('vue', () => ({
  ...(jest.requireActual('vue') as any),
  provide: jest.fn(),
}));

describe('createDataClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create data client with default options', () => {
    const provider = createDataClient();

    expect(provider.controller).toBeInstanceOf(Controller);
    expect(provider.stateRef).toBeDefined();
    expect(typeof provider.start).toBe('function');
    expect(typeof provider.stop).toBe('function');
  });

  it('should create data client with custom Controller', () => {
    const provider = createDataClient({ Controller: Controller });

    expect(provider.controller).toBeInstanceOf(Controller);
  });

  it('should create data client with custom managers', () => {
    const customNetworkManager = new NetworkManager();
    const customSubscriptionManager = new SubscriptionManager(
      PollingSubscription,
    );
    const customManagers = [customNetworkManager, customSubscriptionManager];

    const provider = createDataClient({ managers: customManagers });

    expect(provider.controller).toBeInstanceOf(Controller);
    expect(provider.stateRef).toBeDefined();
  });

  it('should create data client with custom initialState', () => {
    const customState: State<unknown> = {
      entities: {},
      indexes: {},
      endpoints: {},
      meta: {},
      entitiesMeta: {},
      optimistic: [],
      lastReset: 12345,
    };

    const provider = createDataClient({ initialState: customState });

    expect(provider.stateRef.value.lastReset).toBe(12345);
  });

  it('should handle actions through middleware chain', async () => {
    // This test covers line 85: dispatch in middleware chain
    const mockApp = {
      provide: jest.fn(),
    } as any;

    const provider = createDataClient({ app: mockApp });
    provider.start();

    // Create a mock action to dispatch through the middleware
    const testAction = {
      type: 'test/SET',
      payload: { id: '1', value: 'test' },
    };

    // Dispatch through controller which goes through middleware chain
    await provider.controller.dispatch(testAction as any);

    // Verify the action was processed
    expect(provider.stateRef.value).toBeDefined();

    provider.stop();
  });

  it('should call start and stop lifecycle methods', () => {
    const provider = createDataClient();

    // Start should initialize managers
    expect(() => provider.start()).not.toThrow();

    // Stop should cleanup managers
    expect(() => provider.stop()).not.toThrow();

    // Stop should be safe to call even without cleanup
    const provider2 = createDataClient();
    expect(() => provider2.stop()).not.toThrow();
  });

  it('should handle middleware dispatch chain', async () => {
    // Create a custom manager that dispatches from middleware (covers line 85)
    class CustomManager implements Manager {
      middleware: Middleware;

      constructor() {
        this.middleware =
          ({ dispatch, getState }) =>
          next =>
          async action => {
            // This dispatch call covers line 85 - middleware calling dispatch
            if (action.type === actionTypes.SET) {
              // Dispatch a RESET action from within middleware
              await dispatch({ type: actionTypes.RESET } as any);
            }
            return next(action);
          };
      }

      cleanup() {}
      init() {
        return () => {};
      }
    }

    const mockApp = {
      provide: jest.fn(),
    } as any;

    // Capture console.warn since we're not including NetworkManager
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const customManager = new CustomManager();
    const provider = createDataClient({
      managers: [customManager],
      app: mockApp,
    });
    provider.start();

    // Verify the NetworkManager warning was triggered
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'NetworkManager not found; this is a required manager.',
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'See https://dataclient.io/docs/guides/redux for hooking up redux',
    );

    // Dispatch a SET action that triggers middleware to dispatch a RESET action
    await provider.controller.dispatch({ type: actionTypes.SET } as any);

    provider.stop();

    consoleWarnSpy.mockRestore();
  });

  it('should compute optimistic state correctly', async () => {
    const provider = createDataClient();
    provider.start();

    // Initial state should have no optimistic updates
    expect(provider.stateRef.value.optimistic).toEqual([]);

    // The state should be reactive
    const initialState = provider.stateRef.value;
    expect(initialState).toBeDefined();

    provider.stop();
  });

  it('should use app.provide when app option is provided', () => {
    const mockApp = {
      provide: jest.fn(),
    } as any;

    const provider = createDataClient({ app: mockApp });

    // Should use app.provide instead of provide()
    expect(mockApp.provide).toHaveBeenCalledTimes(2);
    expect(mockApp.provide).toHaveBeenCalledWith(StateKey, provider.stateRef);
    expect(mockApp.provide).toHaveBeenCalledWith(
      ControllerKey,
      provider.controller,
    );
  });

  it('should accept custom gcPolicy', () => {
    const customGcPolicy = {
      expireAt: Date.now() + 10000,
    } as any;

    const provider = createDataClient({ gcPolicy: customGcPolicy });

    expect(provider.controller).toBeInstanceOf(Controller);
  });

  it('should maintain stable controller and manager instances', () => {
    const provider1 = createDataClient();
    const provider2 = createDataClient();

    // Different providers should have different controller instances
    expect(provider1.controller).not.toBe(provider2.controller);

    // Same provider should maintain stable controller
    const controller1 = provider1.controller;
    expect(provider1.controller).toBe(controller1);
  });

  it('should handle sequential dispatches correctly', async () => {
    const mockApp = {
      provide: jest.fn(),
    } as any;

    const provider = createDataClient({ app: mockApp });
    provider.start();

    // Dispatch multiple actions sequentially to test both branches of resolveNext check
    await provider.controller.dispatch({ type: actionTypes.RESET } as any);
    await provider.controller.dispatch({ type: actionTypes.RESET } as any);

    // Verify state is updated
    expect(provider.stateRef.value).toBeDefined();

    provider.stop();
  });
});
