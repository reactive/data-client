export function shouldAttachSources({
  prefsReady,
  isBot,
  nearViewport,
  reducedData,
  forceAttach,
}: {
  prefsReady: boolean;
  isBot: boolean;
  nearViewport: boolean;
  reducedData: boolean;
  forceAttach: boolean;
}): boolean {
  return prefsReady && !isBot && nearViewport && (!reducedData || forceAttach);
}
