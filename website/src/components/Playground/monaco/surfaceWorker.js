/**
 * Runs inside Monaco's TypeScript worker, loaded as its `customWorkerPath`
 * (see ./setup.ts). Plain JS, since it is loaded as text.
 *
 * Monaco checks every model on the page as one program, so a file without
 * imports (a script, whose declarations are global) shares its names with
 * every other editor's scripts. This gives each editor surface (model paths
 * `/<id>/…`, see ./modelPath.ts) a program of its own files and the type
 * libs, so a playground sees its own declarations and no other's. A model
 * outside any surface (a diff editor's side) is a program of its own.
 */
/** The files a model is checked with: its surface (`file:///123/api.ts` →
 * `123`), else the model alone */
function scopeOf(fileName) {
  return /^\w+:\/\/\/(\d+)\//.exec(fileName)?.[1] ?? fileName;
}

/** Frees the programs of scopes that no longer have models */
function dropUnmounted(services, modelNames) {
  const mounted = new Set(modelNames.map(scopeOf));
  for (const [scope, service] of services) {
    if (!mounted.has(scope)) {
      service.dispose();
      services.delete(scope);
    }
  }
}

self.customTSWorkerFactory = TypeScriptWorker =>
  class SurfaceWorker extends TypeScriptWorker {
    constructor(ctx, createData) {
      super(ctx, createData);
      // lib files are parsed once, for all programs
      const registry = self.ts.createDocumentRegistry();
      /** Language service of each scope (see scopeOf) */
      const services = new Map();
      const modelNames = () =>
        this._ctx.getMirrorModels().map(model => model.uri.toString());
      const createService = scope => {
        const host = Object.create(this);
        // the models in this scope, and the type libs
        host.getScriptFileNames = () =>
          modelNames()
            .filter(name => scopeOf(name) === scope)
            .concat(Object.keys(this._extraLibs));
        return self.ts.createLanguageService(host, registry);
      };
      const serviceFor = fileName => {
        const scope = scopeOf(fileName);
        if (!services.has(scope)) {
          dropUnmounted(services, modelNames());
          services.set(scope, createService(scope));
        }
        return services.get(scope);
      };
      // every call the worker makes names the file first, except
      // getCompilerOptionsDiagnostics() (on every check), which no file owns:
      // it gets the type libs alone, never a program of every model
      this._languageService = new Proxy(this._languageService, {
        get: (target, method) =>
          typeof target[method] === 'function' ?
            (...args) =>
              serviceFor(typeof args[0] === 'string' ? args[0] : '')[method](
                ...args,
              )
          : target[method],
      });
    }
  };
