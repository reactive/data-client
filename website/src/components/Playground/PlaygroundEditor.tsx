import PlaygroundLiveEditor from './PlaygroundLiveEditor';
import PlaygroundMonacoEditor from './PlaygroundMonacoEditor';
import usingMonaco from './usingMonaco';

const PlaygroundEditor = usingMonaco
  ? PlaygroundMonacoEditor
  : PlaygroundLiveEditor;
export default PlaygroundEditor;
