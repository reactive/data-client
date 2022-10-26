import PlaygroundMonacoEditor from './PlaygroundMonacoEditor';
import PlaygroundLiveEditor from './PlaygroundLiveEditor';

const PlaygroundEditor =
  typeof window !== 'undefined' &&
  !/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)
    ? PlaygroundMonacoEditor
    : PlaygroundLiveEditor;
export default PlaygroundEditor;
