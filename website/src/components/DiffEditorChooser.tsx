import DiffEditorMonaco, { type DiffMonacoProps } from './DiffEditorMonaco';
import usingMonaco from './Playground/usingMonaco';

const DiffEditorChooser =
  usingMonaco ? DiffEditorMonaco : ({ fallback }: DiffMonacoProps) => fallback;
export default DiffEditorChooser;
