/** Parses a docs page the way the site does (Docusaurus' preprocessor, then remark) */
import remarkComment from '@slorber/remark-comment';
import { createRequire } from 'node:module';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const require = createRequire(import.meta.url);
const preprocessContent =
  require('@docusaurus/mdx-loader/lib/preprocessor').default;

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkMdx)
  .use(remarkComment)
  .use(remarkGfm)
  .use(remarkDirective);

/**
 * `input` is the content as remark sees it; throws remark's error (with
 * `line` and `column`) on content MDX can't compile
 */
export function parseMarkdown(content, filePath) {
  const input = preprocessContent({
    fileContent: content,
    filePath,
    markdownConfig: { mdx1Compat: { headingIds: true, admonitions: true } },
    admonitions: true,
  });
  return { input, tree: processor.parse(input) };
}
