import InteractiveEditor from './editor/InteractiveEditor';
import PlaygroundLiveEditor from './PlaygroundLiveEditor';

// Always use Monaco editor wrapper - mobile/bot check happens inside
// This avoids hydration mismatch from module-level navigator checks
const PlaygroundEditor = InteractiveEditor;
export default PlaygroundEditor;

// Re-export for use as fallback inside Monaco editor
export { PlaygroundLiveEditor };
