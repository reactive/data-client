import { Controller, initialState } from '@data-client/core';
import type { State } from '@data-client/core';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { shallowRef } from 'vue';

import {
  StateKey,
  ControllerKey,
  FallbackStateRef,
  useController,
  injectState,
} from '../context';

// Mock Vue's inject function
const mockInjectMap: Map<symbol, any> = new Map();

jest.mock('vue', () => {
  const actual = jest.requireActual('vue') as any;
  return {
    ...(actual || {}),
    inject: jest.fn((key: symbol, defaultValue: any) => {
      return mockInjectMap.get(key) ?? defaultValue;
    }),
  };
});

describe('context', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockInjectMap.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('FallbackStateRef', () => {
    it('should be a shallow ref with initial state', () => {
      expect(FallbackStateRef.value).toEqual(initialState);
    });

    it('should be reactive', () => {
      const initialValue = FallbackStateRef.value;
      const newState: State<unknown> = {
        ...initialState,
        endpoints: { test: { data: 'value' } } as any,
      };
      FallbackStateRef.value = newState;
      expect(FallbackStateRef.value).toEqual(newState);
      // Restore original state
      FallbackStateRef.value = initialValue;
    });
  });

  describe('useController', () => {
    it('should return the injected controller when provided', () => {
      const mockController = new Controller();
      mockInjectMap.set(ControllerKey, mockController);

      const result = useController();

      expect(result).toBe(mockController);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return a new Controller when not provided', () => {
      mockInjectMap.set(ControllerKey, null);

      const result = useController();

      expect(result).toBeInstanceOf(Controller);
    });

    it('should log error in development when controller is not provided', () => {
      process.env.NODE_ENV = 'development';
      mockInjectMap.set(ControllerKey, null);

      useController();

      expect(consoleErrorSpy.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should not log error in production when controller is not provided', () => {
      process.env.NODE_ENV = 'production';
      mockInjectMap.set(ControllerKey, null);

      useController();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined controller', () => {
      mockInjectMap.set(ControllerKey, undefined);

      const result = useController();

      expect(result).toBeInstanceOf(Controller);
    });
  });

  describe('injectState', () => {
    it('should return the injected state when provided', () => {
      const mockState = shallowRef<State<unknown>>({
        ...initialState,
        endpoints: { test: { data: 'value' } } as any,
      });
      mockInjectMap.set(StateKey, mockState);

      const result = injectState();

      expect(result).toBe(mockState);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return FallbackStateRef when not provided', () => {
      mockInjectMap.set(StateKey, null);

      const result = injectState();

      expect(result).toBe(FallbackStateRef);
    });

    it('should log error in development when state is not provided', () => {
      process.env.NODE_ENV = 'development';
      mockInjectMap.set(StateKey, null);

      injectState();

      expect(consoleErrorSpy.mock.calls[0][0]).toMatchSnapshot();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://dataclient.io/docs/getting-started/installation',
        ),
      );
    });

    it('should not log error in production when state is not provided', () => {
      process.env.NODE_ENV = 'production';
      mockInjectMap.set(StateKey, null);

      injectState();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined state', () => {
      mockInjectMap.set(StateKey, undefined);

      const result = injectState();

      expect(result).toBe(FallbackStateRef);
    });

    it('should return state ref that is reactive', () => {
      const mockState = shallowRef<State<unknown>>(initialState);
      mockInjectMap.set(StateKey, mockState);

      const result = injectState();

      expect(result.value).toEqual(initialState);

      const newState: State<unknown> = {
        ...initialState,
        endpoints: { test: { data: 'updated' } } as any,
      };
      mockState.value = newState;

      expect(result.value).toEqual(newState);
    });
  });
});
