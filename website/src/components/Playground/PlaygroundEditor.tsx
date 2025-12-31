import PlaygroundLiveEditor from './PlaygroundLiveEditor';
import PlaygroundMonacoEditor from './PlaygroundMonacoEditor';

// Always use Monaco editor wrapper - mobile/bot check happens inside
// This avoids hydration mismatch from module-level navigator checks
const PlaygroundEditor = PlaygroundMonacoEditor;
export default PlaygroundEditor;

// Re-export for use as fallback inside Monaco editor
export { PlaygroundLiveEditor };
