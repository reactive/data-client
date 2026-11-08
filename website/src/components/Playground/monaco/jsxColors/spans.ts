/**
 * A file's JSX spans: a flat list of start (offset), length and kind for each
 * tag name, attribute name and run of text, as TypeScript classifies them.
 * These are the kinds.
 */
export const JSX_TAG = 0;
export const JSX_ATTRIBUTE = 1;
export const JSX_TEXT = 2;

/** Whether a JSX tag name (or its first letter) names a component, colored
 * apart from HTML tags */
export const isComponentName = (name: string) => /^[A-Z]/.test(name);
