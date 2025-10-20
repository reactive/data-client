import type { EndpointInterface } from '@data-client/core';

export interface FixtureEndpoint extends EndpointInterface {
  key(...args: any[]): string;
}

export interface SuccessFixtureEndpoint extends FixtureEndpoint {
  (...args: any[]): Promise<any>;
}

export interface ErrorFixtureEndpoint extends FixtureEndpoint {
  (...args: any[]): Promise<never>;
}

export interface Fixture {
  endpoint: FixtureEndpoint;
  args: any[];
  response: any;
  error?: boolean;
}

export interface SuccessFixture extends Fixture {
  endpoint: SuccessFixtureEndpoint;
  error?: false;
}

export interface ErrorFixture extends Fixture {
  endpoint: ErrorFixtureEndpoint;
  error: true;
  response: any;
}

export interface Interceptor<T = any> {
  endpoint: FixtureEndpoint;
  response: (request: {
    body?: any;
    headers?: Record<string, string>;
    url: string;
    method: string;
    args: any[];
  }) => T | Promise<T>;
  error?: boolean;
}
