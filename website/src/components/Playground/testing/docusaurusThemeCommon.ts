// Jest stand-in for @docusaurus/theme-common, whose ESM build Jest doesn't transform
export function usePluralForm() {
  return {
    // English rules: "one|other"
    selectMessage: (count: number, messages: string) => {
      const forms = messages.split('|');
      return forms[Math.min(count === 1 ? 0 : 1, forms.length - 1)];
    },
  };
}
