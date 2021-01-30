function runCompat(endpoint, options) {
  endpoint.type = endpoint.sideEffect ? 'mutate' : 'read';
  endpoint.options = { ...options };
  delete endpoint.options.key;
  delete endpoint.options.schema;
  delete endpoint.options.sideEffect;
  delete endpoint.options.fetch;
  delete endpoint.options.getFetchKey;
  delete endpoint.options.options;
  if (Object.keys(endpoint.options).length === 0) {
    delete endpoint.options;
  }
  if (endpoint.schema === undefined) endpoint.schema = null;
}

let CSP = false;
try {
  Function();
} catch (e) {
  CSP = true;
}

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
    /** The following is for compatibility with FetchShape */
    self.getFetchKey = params => self.key(params);

    if (fetchFunction) self.fetch = fetchFunction;
    Object.assign(self, options);

    /** The following is for compatibility with FetchShape */
    runCompat(self, options);
    return self;
  }

  key(params) {
    return `${this.fetch.name} ${JSON.stringify(params)}`;
  }

  extend(options) {
    // make a constructor/prototype based off this
    // extend from it and init with options sent
    class E extends this.constructor {}

    Object.assign(E.prototype, this);
    const instance = new E(options.fetch, options);

    /** The following is for compatibility with FetchShape */
    runCompat(instance, { ...this.options, ...options });

    return instance;
  }
}
