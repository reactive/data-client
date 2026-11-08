/**
 * Runs inside Monaco's TypeScript worker, loaded as text ahead of the
 * script that sets `self.customTSWorkerFactory` (see ./README.md). Plain JS,
 * since it is loaded as text.
 */
{
  /** ts.ClassificationType of JSX tag names (open, close, self-closing),
   * attribute names and text, as ./spans.ts's kinds: JSX_TAG (0),
   * JSX_ATTRIBUTE (1), JSX_TEXT (2) */
  const JSX_KINDS = { 19: 0, 20: 0, 21: 0, 22: 1, 23: 2 };

  /** `TypeScriptWorker` with getJsxSpans */
  self.withJsxSpans = TypeScriptWorker =>
    class extends TypeScriptWorker {
      /** TypeScript's reading of the JSX in `fileName`, as JSX spans
       * (./spans.ts) */
      getJsxSpans(fileName) {
        const length = this._getScriptText(fileName)?.length;
        if (!length) return [];
        const { spans } =
          this._languageService.getEncodedSyntacticClassifications(fileName, {
            start: 0,
            length,
          });
        const jsx = [];
        for (let i = 0; i < spans.length; i += 3)
          if (spans[i + 2] in JSX_KINDS)
            jsx.push(spans[i], spans[i + 1], JSX_KINDS[spans[i + 2]]);
        return jsx;
      }
    };
}
