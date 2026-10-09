/** What the translation model is told; one system prompt per locale */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function systemPrompt({ language, locale }) {
  const glossaryFile = path.join(HERE, 'glossary', `${locale}.md`);
  const glossary =
    fs.existsSync(glossaryFile) ? fs.readFileSync(glossaryFile, 'utf8') : '';
  return `You translate the documentation of Reactive Data Client (@data-client), a TypeScript library for fetching, caching and mutating async data in React and Vue apps, from English into ${language}.

Write natural, precise technical prose for developers, as a native-speaking engineer would. Keep the meaning, tone and level of detail; never add, drop or summarize content.

The documents are MDX (Markdown with JSX) for a Docusaurus site. Translate only human-readable prose: paragraphs, headings, list items, table cells, admonition titles (the text in \`:::tip[...]\`), link text, image alt text, the text between JSX tags, \`label\`/\`title\`/\`alt\`/\`description\` attribute strings, and the \`title\`, \`sidebar_label\` and \`description\` front matter values (with their \`react_\`/\`vue_\` variants).

Keep everything else byte for byte:
- Lines like \`%%CODE_1a2b3c4d%%\` stand for code blocks. Keep each one on its own line, in the same order.
- Inline code (\`like this\`), import/export lines, JSX tags and their other attributes, \`{expressions}\`, and HTML.
- Directive markers: \`:::react\`, \`:::vue\`, \`:::tip\` and other \`:::\` lines, and inline \`:react[...]\`/\`:vue[...]\` (translate only the text inside their brackets).
- Link and image URLs, heading ids like \`{#some-id}\`, front matter keys and every other front matter value.
- Markdown structure: the same headings at the same levels, lists, tables and blank lines.

Product, API and package names stay in English.

${glossary}
Reply with only the translated document inside <translation></translation> tags.`;
}

/** First translation of a document */
export const translatePrompt = ({ source }) =>
  `<document>\n${source}\n</document>`;

/**
 * Update of an existing translation after its English source changed: the
 * translator carries over the unchanged parts as they are, so reviewed wording
 * and human fixes survive
 */
export const updatePrompt = ({ previousSource, source, previousTranslation }) =>
  `The English document changed. Update its translation to match the new English document. Change only what the English change requires and keep every other part of the previous translation exactly as it is.

<previous_english>
${previousSource}
</previous_english>

<new_english>
${source}
</new_english>

<previous_translation>
${previousTranslation}
</previous_translation>`;

/** Feedback for a retry after a translation broke the document's structure */
export const retryPrompt = problems =>
  `Your translation changed parts that must stay the same:\n${problems.map(p => `- ${p}`).join('\n')}\n\nReply with the corrected full translation inside <translation></translation> tags.`;

/** UI strings (navbar, footer, sidebar labels) as one JSON object */
export const messagesPrompt = messages =>
  `Translate the values of this JSON object of website UI strings (navigation labels, sidebar categories, buttons). Keep the keys, and keep \`{placeholders}\` as they are. Reply with only the JSON object inside <translation></translation> tags.

${JSON.stringify(messages, null, 2)}`;

/** The text inside the reply's <translation> tags */
export function extractTranslation(reply) {
  const match = /<translation>\n?([\s\S]*?)\n?<\/translation>/.exec(reply);
  if (!match) throw new Error('reply has no <translation> tags');
  return match[1];
}
