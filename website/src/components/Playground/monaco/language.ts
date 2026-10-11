export function extensionToMonacoLanguage(ext: string) {
  if (ext === 'tsx' || ext === 'ts') return 'typescript';
  return ext;
}
