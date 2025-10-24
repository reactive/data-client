import {
  Controller,
  NetworkManager,
  PollingSubscription,
  SubscriptionManager,
} from '@data-client/core';
import type { State } from '@data-client/core';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mount } from '@vue/test-utils';
import { defineComponent, h, inject } from 'vue';

import { ControllerKey, StateKey } from '../../context';
import { DataClientPlugin } from '../DataClientPlugin';

describe('DataClientPlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should install plugin with default options', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const controller = inject(ControllerKey);
        const state = inject(StateKey);
        return () =>
          h('div', [
            h('div', { id: 'has-controller' }, controller ? 'yes' : 'no'),
            h('div', { id: 'has-state' }, state ? 'yes' : 'no'),
          ]);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    expect(wrapper.find('#has-controller').text()).toBe('yes');
    expect(wrapper.find('#has-state').text()).toBe('yes');

    wrapper.unmount();
  });

  it('should provide Controller instance', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const controller = inject(ControllerKey);
        return () =>
          h(
            'div',
            {
              id: 'controller-type',
            },
            controller instanceof Controller ? 'Controller' : 'unknown',
          );
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    expect(wrapper.find('#controller-type').text()).toBe('Controller');

    wrapper.unmount();
  });

  it('should provide state ref', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const stateRef = inject(StateKey);
        return () =>
          h(
            'div',
            {
              id: 'has-state-value',
            },
            stateRef?.value !== undefined ? 'yes' : 'no',
          );
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    expect(wrapper.find('#has-state-value').text()).toBe('yes');

    wrapper.unmount();
  });

  it('should accept custom managers option', () => {
    const customNetworkManager = new NetworkManager();
    const customSubscriptionManager = new SubscriptionManager(
      PollingSubscription,
    );
    const customManagers = [customNetworkManager, customSubscriptionManager];

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        inject(ControllerKey);
        return () => h('div', 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin, { managers: customManagers }]],
      },
    });

    expect(wrapper.vm).toBeDefined();
    wrapper.unmount();
  });

  it('should accept custom initialState option', () => {
    const customState: State<unknown> = {
      entities: {},
      indexes: {},
      endpoints: {},
      meta: {},
      entitiesMeta: {},
      optimistic: [],
      lastReset: Date.now(),
    };

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const stateRef = inject(StateKey);
        return () =>
          h(
            'div',
            {
              id: 'last-reset',
            },
            String(stateRef?.value?.lastReset),
          );
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin, { initialState: customState }]],
      },
    });

    expect(wrapper.find('#last-reset').text()).toBe(
      String(customState.lastReset),
    );

    wrapper.unmount();
  });

  it('should call start ONCE on app install (plugin lifecycle)', () => {
    const startSpy = jest.fn();
    const originalCreateDataClient =
      require('../createDataClient.js').createDataClient;

    // Mock createDataClient to spy on start
    const mockCreateDataClient = jest.fn(options => {
      const provider = originalCreateDataClient(options);
      const originalStart = provider.start;
      provider.start = () => {
        startSpy();
        originalStart();
      };
      return provider;
    });

    jest
      .spyOn(require('../createDataClient.js'), 'createDataClient')
      .mockImplementation(mockCreateDataClient as any);

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        return () => h('div', 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // Start should be called exactly once when plugin is installed
    expect(startSpy).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    jest.restoreAllMocks();
  });

  it('should call stop ONCE on app unmount (plugin lifecycle)', () => {
    const stopSpy = jest.fn();
    const originalCreateDataClient =
      require('../createDataClient.js').createDataClient;

    // Mock createDataClient to spy on stop
    const mockCreateDataClient = jest.fn(options => {
      const provider = originalCreateDataClient(options);
      const originalStop = provider.stop;
      provider.stop = () => {
        stopSpy();
        originalStop();
      };
      return provider;
    });

    jest
      .spyOn(require('../createDataClient.js'), 'createDataClient')
      .mockImplementation(mockCreateDataClient as any);

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        return () => h('div', 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // Stop should not be called while app is running
    expect(stopSpy).not.toHaveBeenCalled();

    wrapper.unmount();

    // Stop should be called exactly once when app unmounts
    expect(stopSpy).toHaveBeenCalledTimes(1);

    jest.restoreAllMocks();
  });

  it('should work with multiple components', () => {
    const ComponentA = defineComponent({
      name: 'ComponentA',
      setup() {
        const controller = inject(ControllerKey);
        return () =>
          h('div', { id: 'component-a' }, controller ? 'A-yes' : 'A-no');
      },
    });

    const ComponentB = defineComponent({
      name: 'ComponentB',
      setup() {
        const controller = inject(ControllerKey);
        return () =>
          h('div', { id: 'component-b' }, controller ? 'B-yes' : 'B-no');
      },
    });

    const ParentComponent = defineComponent({
      name: 'ParentComponent',
      setup() {
        return () => h('div', [h(ComponentA), h(ComponentB)]);
      },
    });

    const wrapper = mount(ParentComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    expect(wrapper.find('#component-a').text()).toBe('A-yes');
    expect(wrapper.find('#component-b').text()).toBe('B-yes');

    wrapper.unmount();
  });

  it('should NOT call start for each component mount - only once for app', () => {
    const startSpy = jest.fn();
    const originalCreateDataClient =
      require('../createDataClient.js').createDataClient;

    const mockCreateDataClient = jest.fn(options => {
      const provider = originalCreateDataClient(options);
      const originalStart = provider.start;
      provider.start = () => {
        startSpy();
        originalStart();
      };
      return provider;
    });

    jest
      .spyOn(require('../createDataClient.js'), 'createDataClient')
      .mockImplementation(mockCreateDataClient as any);

    const ComponentA = defineComponent({
      name: 'ComponentA',
      setup() {
        const controller = inject(ControllerKey);
        return () => h('div', { id: 'a' }, controller ? 'yes' : 'no');
      },
    });

    const ComponentB = defineComponent({
      name: 'ComponentB',
      setup() {
        const controller = inject(ControllerKey);
        return () => h('div', { id: 'b' }, controller ? 'yes' : 'no');
      },
    });

    const ComponentC = defineComponent({
      name: 'ComponentC',
      setup() {
        const controller = inject(ControllerKey);
        return () => h('div', { id: 'c' }, controller ? 'yes' : 'no');
      },
    });

    const ParentComponent = defineComponent({
      name: 'ParentComponent',
      setup() {
        return () => h('div', [h(ComponentA), h(ComponentB), h(ComponentC)]);
      },
    });

    const wrapper = mount(ParentComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // Verify all components mounted successfully
    expect(wrapper.find('#a').text()).toBe('yes');
    expect(wrapper.find('#b').text()).toBe('yes');
    expect(wrapper.find('#c').text()).toBe('yes');

    // Start should be called exactly ONCE despite 3 components mounting
    expect(startSpy).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    jest.restoreAllMocks();
  });

  it('should NOT call stop for individual component unmount - only on app unmount', () => {
    const stopSpy = jest.fn();
    const originalCreateDataClient =
      require('../createDataClient.js').createDataClient;

    const mockCreateDataClient = jest.fn(options => {
      const provider = originalCreateDataClient(options);
      const originalStop = provider.stop;
      provider.stop = () => {
        stopSpy();
        originalStop();
      };
      return provider;
    });

    jest
      .spyOn(require('../createDataClient.js'), 'createDataClient')
      .mockImplementation(mockCreateDataClient as any);

    const ComponentA = defineComponent({
      name: 'ComponentA',
      setup() {
        const controller = inject(ControllerKey);
        return () => h('div', { id: 'a' }, controller ? 'yes' : 'no');
      },
    });

    const ComponentB = defineComponent({
      name: 'ComponentB',
      setup() {
        const controller = inject(ControllerKey);
        return () => h('div', { id: 'b' }, controller ? 'yes' : 'no');
      },
    });

    const ComponentC = defineComponent({
      name: 'ComponentC',
      setup() {
        const controller = inject(ControllerKey);
        return () => h('div', { id: 'c' }, controller ? 'yes' : 'no');
      },
    });

    const ParentComponent = defineComponent({
      name: 'ParentComponent',
      setup() {
        return () => h('div', [h(ComponentA), h(ComponentB), h(ComponentC)]);
      },
    });

    const wrapper = mount(ParentComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // Verify all components mounted
    expect(wrapper.find('#a').exists()).toBe(true);
    expect(wrapper.find('#b').exists()).toBe(true);
    expect(wrapper.find('#c').exists()).toBe(true);

    // Stop should NOT be called while components are running
    expect(stopSpy).not.toHaveBeenCalled();

    wrapper.unmount();

    // Stop should be called exactly ONCE when app unmounts
    // (not once per component - only once for the app)
    expect(stopSpy).toHaveBeenCalledTimes(1);

    jest.restoreAllMocks();
  });

  it('should maintain same controller/state instance across all components', () => {
    const controllers: any[] = [];
    const states: any[] = [];

    const createTestComponent = (name: string) =>
      defineComponent({
        name,
        setup() {
          const controller = inject(ControllerKey);
          const state = inject(StateKey);
          controllers.push(controller);
          states.push(state);
          return () => h('div', { id: name.toLowerCase() }, 'test');
        },
      });

    const ComponentA = createTestComponent('ComponentA');
    const ComponentB = createTestComponent('ComponentB');
    const ComponentC = createTestComponent('ComponentC');

    const ParentComponent = defineComponent({
      name: 'ParentComponent',
      setup() {
        return () => h('div', [h(ComponentA), h(ComponentB), h(ComponentC)]);
      },
    });

    const wrapper = mount(ParentComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // All components should receive the SAME controller instance
    expect(controllers.length).toBe(3);
    expect(controllers[0]).toBe(controllers[1]);
    expect(controllers[1]).toBe(controllers[2]);

    // All components should receive the SAME state ref
    expect(states.length).toBe(3);
    expect(states[0]).toBe(states[1]);
    expect(states[1]).toBe(states[2]);

    wrapper.unmount();
  });

  it('should provide reactive state', async () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const stateRef = inject(StateKey);

        return () =>
          h('div', [
            h('div', { id: 'has-state' }, stateRef ? 'yes' : 'no'),
            h(
              'div',
              { id: 'has-entities' },
              stateRef?.value?.entities ? 'yes' : 'no',
            ),
          ]);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    expect(wrapper.find('#has-state').text()).toBe('yes');
    expect(wrapper.find('#has-entities').text()).toBe('yes');

    wrapper.unmount();
  });

  it('should return ProvidedDataClient from install', () => {
    const app = {
      mixin: jest.fn(),
      provide: jest.fn(),
      config: {
        globalProperties: {},
      },
      onUnmount: jest.fn(),
    } as any;

    const result = DataClientPlugin.install(app, {});

    expect(result).toBeDefined();
    expect(result.controller).toBeDefined();
    expect(result.stateRef).toBeDefined();
    expect(typeof result.start).toBe('function');
    expect(typeof result.stop).toBe('function');
    expect(app.provide).toHaveBeenCalledTimes(2);
  });

  it('should handle app without mixin method gracefully', () => {
    const app = {
      provide: jest.fn(),
      config: {
        globalProperties: {},
      },
      onUnmount: jest.fn(),
    } as any;

    expect(() => {
      DataClientPlugin.install(app, {});
    }).not.toThrow();
    expect(app.provide).toHaveBeenCalledTimes(2);
  });

  it('should use getDefaultManagers when no managers provided', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        inject(ControllerKey);
        return () => h('div', 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // Should not throw and should provide controller
    expect(wrapper.vm).toBeDefined();

    wrapper.unmount();
  });

  it('should accept custom Controller class', () => {
    class CustomController extends Controller {}

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const controller = inject(ControllerKey);
        return () =>
          h(
            'div',
            {
              id: 'controller-type',
            },
            controller instanceof CustomController ? 'custom' : 'default',
          );
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin, { Controller: CustomController }]],
      },
    });

    expect(wrapper.find('#controller-type').text()).toBe('custom');

    wrapper.unmount();
  });
});
