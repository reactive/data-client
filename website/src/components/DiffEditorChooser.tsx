import DiffEditorMonaco from './DiffEditorMonaco';

// Always use DiffEditorMonaco which handles SSR via <BrowserOnly>
// The mobile/bot detection is handled inside DiffEditorMonaco
const DiffEditorChooser = DiffEditorMonaco;
export default DiffEditorChooser;
