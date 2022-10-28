import typescriptTransform from './typescriptTransform';
import usingMonaco from './usingMonaco';

const transformCode = usingMonaco
  ? code => {
      return code.replaceAll(/^(import.+$|export (default )?)/gm, '');
    }
  : typescriptTransform;
export default typescriptTransform;
