/**
 * Runs inside Monaco's TypeScript worker, loaded as its `customWorkerPath`
 * (see ./setup.ts). Plain JS, since it is loaded as text.
 *
 * Monaco checks every model on the page as one program, so a file without
 * imports (a script, whose declarations are global) shares its names with
 * every other editor's scripts. This gives each editor surface (model paths
 * `/<id>/…`, see ./modelPath.ts) with a script a program of its own files and
 * the type libs, so it sees its own declarations and no other's. A script
 * outside any surface (a diff editor's side) is a program of its own.
 * Surfaces of modules alone leak nothing, so they share one program: each
 * program costs a type checker over the type libs.
 */

/** Scope of the modules-only surfaces */
const MODULES = '';

/** `file:///123/api.ts` → `/123/` (undefined outside a surface) */
function surfaceOf(fileName) {
  return /^\w+:\/\/(\/\d+\/)/.exec(fileName)?.[1];
}

self.customTSWorkerFactory = TypeScriptWorker =>
  class SurfaceWorker extends TypeScriptWorker {
    constructor(ctx, createData) {
      super(ctx, createData);
      // lib files are parsed once, for all programs
      const registry = self.ts.createDocumentRegistry();
      /** Language service of each scope (see scopes) */
      const services = new Map();

      /** Whether each model imports or exports (a script's declarations
       * are global), by the version it was read at */
      const modules = new WeakMap();
      const readIsModule = model => {
        let read = modules.get(model);
        if (read?.version !== model.version) {
          const source = self.ts.createSourceFile(
            model.uri.toString(),
            model.getValue(),
            self.ts.ScriptTarget.Latest,
          );
          read = {
            version: model.version,
            isModule: self.ts.isExternalModule(source),
          };
          modules.set(model, read);
        }
        return read.isModule;
      };

      /** Each model's file name, with its scope: the models of a surface
       * with a script share its scope; every other module is in MODULES */
      const scopes = () => {
        const files = this._ctx.getMirrorModels().map(model => {
          const name = model.uri.toString();
          return {
            name,
            version: model.version,
            // a script outside any surface is a scope of its own
            surface: surfaceOf(name) ?? name,
            isModule: readIsModule(model),
          };
        });
        const withScript = new Set(
          files.filter(file => !file.isModule).map(file => file.surface),
        );
        for (const file of files)
          file.scope = withScript.has(file.surface) ? file.surface : MODULES;
        return files;
      };

      /** scopes() as of the call being answered: every call reads them
       * first (serviceFor), then TypeScript asks the host for them */
      let current = [];
      const createService = scope => {
        const host = Object.create(this);
        const files = () => current.filter(file => file.scope === scope);
        host.getScriptFileNames = () =>
          files()
            .map(file => file.name)
            .concat(Object.keys(this._extraLibs));
        // lets TypeScript skip re-syncing a program whose files are as they
        // were (Monaco's host leaves it out, so every call re-syncs)
        host.getProjectVersion = () =>
          Object.entries(this._extraLibs)
            .map(([name, lib]) => ({ name, version: lib.version }))
            .concat(files())
            .map(file => `${file.name}@${file.version}`)
            .join();
        return self.ts.createLanguageService(host, registry);
      };

      const serviceFor = fileName => {
        current = scopes();
        const scope =
          current.find(file => file.name === fileName)?.scope ?? MODULES;
        if (!services.has(scope)) {
          // free the programs of scopes that no longer have models
          const live = new Set(current.map(file => file.scope)).add(MODULES);
          for (const [old, service] of services)
            if (!live.has(old)) {
              service.dispose();
              services.delete(old);
            }
          services.set(scope, createService(scope));
        }
        return services.get(scope);
      };

      // every call the worker makes names the file first
      this._languageService = new Proxy(this._languageService, {
        get: (target, method) =>
          typeof target[method] === 'function' ?
            (fileName, ...rest) =>
              serviceFor(fileName)[method](fileName, ...rest)
          : target[method],
      });
    }
  };
