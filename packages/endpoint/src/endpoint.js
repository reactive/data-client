export default class Endpoint extends Function {
  constructor(fetchFunction, options) {
    super('return arguments.callee.fetch.apply(arguments.callee, arguments)');
    this.fetch = fetchFunction;
    Object.assign(this, options);
    /** The following is for compatibility with FetchShape */
    this.type = this.sideEffect ? 'mutate' : 'read';
    this.options = { ...options };
    delete this.options.key;
    delete this.options.schema;
    delete this.options.sideEffect;
    if (Object.keys(this.options).length === 0) {
      delete this.options;
    }
  }

  key(params) {
    return `${this.fetch.name} ${JSON.stringify(params)}`;
  }

  extend(options) {
    /** The following is for compatibility with FetchShape */
    const optionsCopy = { ...options };
    delete optionsCopy.key;
    delete optionsCopy.schema;
    delete optionsCopy.sideEffect;

    const optionsToPass = {
      ...this,
      ...options,
      /** The following is for compatibility with FetchShape */
      options: {
        ...this.options,
        optionsCopy,
      },
    };
    return new this.constructor(options.fetch ?? this.fetch, optionsToPass);
  }

  /** The following is for compatibility with FetchShape */
  schema = null;
  getFetchKey = params => {
    return this.key(params);
  };
}
