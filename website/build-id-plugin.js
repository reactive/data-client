/* global module, require */
const fs = require('fs/promises');
const path = require('path');

/** The runtime chunk maps every chunk to its content hash, so its file name
 * changes exactly when some chunk's does: a free, deterministic build id.
 * Written to `build-id.txt` so a tab can tell whether the deployed build still
 * has its chunks (src/staleDeploy.ts; its BUILD_ID_PATTERN matches the same names). */
module.exports = function () {
  return {
    name: 'build-id-plugin',
    async postBuild({ outDir }) {
      const js = await fs.readdir(path.join(outDir, 'assets/js'));
      const runtime = js.filter(file => /^runtime~main\.\w+\.js$/.test(file));
      if (runtime.length !== 1)
        throw new Error(
          `build-id-plugin: expected one runtime~main chunk, found ${runtime.length}`,
        );
      await fs.writeFile(path.join(outDir, 'build-id.txt'), runtime[0]);
    },
  };
};
