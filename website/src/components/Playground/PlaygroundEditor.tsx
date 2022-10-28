import PlaygroundMonacoEditor from './PlaygroundMonacoEditor';
import PlaygroundLiveEditor from './PlaygroundLiveEditor';
import usingMonaco from './usingMonaco';

const PlaygroundEditor = usingMonaco
  ? PlaygroundMonacoEditor
  : PlaygroundLiveEditor;
export default PlaygroundEditor;
