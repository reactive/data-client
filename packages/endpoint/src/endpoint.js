import { CSP } from './CSP.js';

/**
 * Defines an async data source.
 * @see https://resthooks.io/docs/api/Endpoint
 */
export default class Endpoint extends Function {
  constructor(fetchFunction, options) {
    let self;
    if (CSP) {
      self = (...args) => self.fetch(...args);
      Object.setPrototypeOf(self, new.target.prototype);
    } else {
      super('return arguments.callee.fetch.apply(arguments.callee, arguments)');
      self = this;
    }

    if (fetchFunction) self.fetch = fetchFunction;

    /** Name propery block
     *
     * To make things callable, we force every instance to be constructed as a function
     * Because of this the name property will be autoset
     * To create a usable naming inheritance pattern, we use __name as a proxy.
     * Every instance then overrides the name property.
     *
     * For protocol specific extensions that wish to customize default naming
     * behavior, be sure to add your own `Object.defineProperty(self, 'name'`
     * in your constructor to override this one.
     */
    let autoName;
    if (
      !(options && 'name' in options) &&
      fetchFunction &&
      fetchFunction.name &&
      fetchFunction.name !== 'anonymous'
    ) {
      autoName = fetchFunction.name;
    }
    Object.defineProperty(self, 'name', {
      get() {
        if (
          /* istanbul ignore else */ process.env.NODE_ENV !== 'production' &&
          self.key === Endpoint.prototype.key &&
          !(autoName || this.__name)
        ) {
          console.error(
            'Endpoint: Autonaming failure.\n\nEndpoint initialized with anonymous function.\nPlease add `name` option or hoist the function definition. https://resthooks.io/rest/api/Endpoint#name',
          );
        }
        return autoName || this.__name;
      },
      set(v) {
        this.__name = v;
      },
    });
    /** End name property block */

    Object.assign(self, options);
    return self;
  }

  key(...args) {
    return `${this.name} ${JSON.stringify(args)}`;
  }

  testKey(key) {
    return key.startsWith(this.name);
  }

  bind(thisArg, ...args) {
    const fetchFunc = this.fetch;
    const keyFunc = this.key;
    return this.extend({
      fetch() {
        return fetchFunc.apply(thisArg ?? this, args);
      },
      key() {
        return keyFunc.apply(this, args);
      },
    });
  }

  extend(options) {
    // make a constructor/prototype based off this
    // extend from it and init with options sent
    class E extends this.constructor {}

    Object.assign(E.prototype, this);

    return new E(options.fetch, options);
  }

  /* istanbul ignore next */
  static {
    /* istanbul ignore if */
    if (test.name !== 'test') {
      this.prototype.key = function (...args) {
        console.error(
          'Rest Hooks Error: https://resthooks.io/errors/osid',
          this,
        );
        return `${this.name} ${JSON.stringify(args)}`;
      };
    }
  }
}
export const ExtendableEndpoint = Endpoint;

function test() {}
