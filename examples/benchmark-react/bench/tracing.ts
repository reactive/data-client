/**
 * Parse Chrome trace JSON to extract duration from first relevant event to last Paint.
 * Fallback: returns 0 if parsing fails - caller can use performance.measure instead.
 */
export function parseTraceDuration(traceBuffer: Buffer): number {
  try {
    const text = traceBuffer.toString('utf-8');
    const events = parseTraceEvents(text);
    if (events.length === 0) return 0;

    const paintEvents = events.filter(
      e => e.name === 'Paint' || e.cat?.includes('blink'),
    );
    const scriptEvents = events.filter(
      e =>
        e.name === 'FunctionCall' ||
        e.name?.includes('EvaluateScript') ||
        e.cat?.includes('devtools.timeline'),
    );

    const firstTs = Math.min(...events.map(e => e.ts).filter(x => x != null));
    const lastPaint =
      paintEvents.length ?
        Math.max(...paintEvents.map(e => e.ts + (e.dur ?? 0)))
      : Math.max(...events.map(e => e.ts + (e.dur ?? 0)));

    return (lastPaint - firstTs) / 1000;
  } catch {
    return 0;
  }
}

interface TraceEvent {
  ts: number;
  dur?: number;
  name?: string;
  cat?: string;
}

function parseTraceEvents(text: string): TraceEvent[] {
  const events: TraceEvent[] = [];
  const lines = text.trim().split('\n');
  for (const line of lines) {
    if (line.startsWith('[') || line.startsWith(']')) continue;
    try {
      const obj = JSON.parse(line.replace(/,$/, '')) as TraceEvent;
      if (obj.ts != null) events.push(obj);
    } catch {
      // skip malformed lines
    }
  }
  return events;
}
