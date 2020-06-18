export default class Endpoint extends Function {
  constructor(fetchFunction, options) {
    super('return arguments.callee.fetch.apply(arguments.callee, arguments)');
    this.fetch = fetchFunction;
    Object.assign(this, options);
  }

  key(params) {
    return `${this.fetch.name} ${JSON.stringify(params)}`;
  }

  extend(options) {
    const optionsToPass = {
      ...this,
      ...options,
    };
    return new this.constructor(options.fetch ?? this.fetch, optionsToPass);
  }
}
