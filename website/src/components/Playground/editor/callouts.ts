export interface Callout {
  /** 1-based line in `editorValue` the callout annotates */
  line: number;
  marker: string;
  text: string;
}

export interface CalloutDocument {
  /** Code for Monaco: callout and highlight comments removed */
  editorValue: string;
  /** Code for static `CodeBlock`: highlight comments kept, markers appended */
  staticValue: string;
  callouts: Callout[];
}

const CALLOUT_COMMENT = /^\s*\/\/ callout: (.+)$/;
const HIGHLIGHT_COMMENT = /^\s*\/\/ highlight-(next-line|start|end)\s*$/;

/** ① … ⑳, then (21) … */
export function calloutMarker(index: number) {
  return index < 20 ? String.fromCharCode(0x2460 + index) : `(${index + 1})`;
}

/**
 * Pulls `// callout: text` comments out of a fence; each annotates the next
 * code line. Markers continue numbering from `startIndex` so callouts across
 * both sides of a diff share one legend.
 */
export function parseCallouts(code: string, startIndex = 0): CalloutDocument {
  const editorLines: string[] = [];
  const staticLines: string[] = [];
  const callouts: Callout[] = [];
  let pending: string[] = [];

  for (const line of code.split('\n')) {
    const callout = CALLOUT_COMMENT.exec(line);
    if (callout) {
      pending.push(callout[1].trim());
      continue;
    }
    // Docusaurus CodeBlock consumes these; Monaco would show them as code
    if (HIGHLIGHT_COMMENT.test(line)) {
      staticLines.push(line);
      continue;
    }
    editorLines.push(line);
    const markers = pending.map(text => {
      const marker = calloutMarker(startIndex + callouts.length);
      callouts.push({ line: editorLines.length, marker, text });
      return marker;
    });
    staticLines.push(
      markers.length ? `${line}  // ${markers.join(' ')}` : line,
    );
    pending = [];
  }

  return {
    editorValue: editorLines.join('\n'),
    staticValue: staticLines.join('\n'),
    callouts,
  };
}
