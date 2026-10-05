/**
 * Renders a docs page to plain markdown for one framework, the way the site
 * renders it (remarkFramework.js, `frameworks:` front matter, `.vue.md`
 * overrides, `vue_` front matter), with MDX partials inlined and site-only
 * components (playgrounds, tabs, embeds) reduced to plain markdown.
 *
 * Used for agent skill references (skillReferences.mjs).
 */
import remarkComment from '@slorber/remark-comment';
import { phrasing } from 'mdast-util-phrasing';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

import providerSetup from '../src/components/providerSetup.mjs';
import { ROOT, SITE, rel } from './site.mjs';

const require = createRequire(import.meta.url);
const preprocessContent =
  require('@docusaurus/mdx-loader/lib/preprocessor').default;

const {
  docIds,
  docIdOf,
  pageFrameworks,
  rewriteFrontMatter,
  frontMatterValue,
} = require('./index.js');
const remarkFramework = require('./remarkFramework.js');

export { ROOT, SITE, rel };

/** docs folder -> route base per framework; keep in sync with docusaurus.config.ts */
const ROUTES = [
  ['docs/core/', { react: '/docs/', vue: '/vue/' }],
  ['docs/rest/', { react: '/rest/', vue: '/rest/' }],
  ['docs/graphql/', { react: '/graphql/', vue: '/graphql/' }],
];
const vueIds = docIds('vue');
const MD = /\.mdx?$/;

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkMdx)
  .use(remarkComment)
  .use(remarkGfm)
  .use(remarkDirective);
const stringifier = unified()
  .use(remarkStringify, {
    bullet: '-',
    emphasis: '_',
    fences: true,
    listItemIndent: 'one',
    rule: '-',
  })
  .use(remarkGfm)
  .use(remarkDirective);

function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = args.join('\0');
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
}

const read = memoize(file => fs.readFileSync(file, 'utf8'));
const exists = memoize(file => fs.existsSync(file));

/** Source for a framework: `foo.vue.md` replaces `foo.md` */
const sourceFor = (file, framework) => {
  const override = file.replace(MD, `.${framework}$&`);
  return exists(override) ? override : file;
};

/** Page content with `<framework>_<key>` front matter applied */
const contentFor = memoize((file, framework) =>
  rewriteFrontMatter(read(sourceFor(file, framework)), framework),
);

/** Parsed once per source; callers get a copy to transform */
const parse = memoize(file => {
  const input = preprocessContent({
    fileContent: read(file),
    filePath: file,
    markdownConfig: { mdx1Compat: { headingIds: true, admonitions: true } },
    admonitions: true,
  });
  try {
    return { input, tree: processor.parse(input) };
  } catch (error) {
    throw new Error(
      `${rel(file)}:${error.line}:${error.column}: ${error.message}`,
    );
  }
});

/** Site route (no host) of a doc for a framework */
export const routeOf = memoize((file, framework) => {
  const relPath = rel(file).replace(/\.(react|vue)(\.mdx?)$/, '$2');
  const match = ROUTES.find(([dir]) => relPath.startsWith(dir));
  if (!match) return;
  const [dir, bases] = match;
  const docId = docIdOf(relPath.slice(dir.length), contentFor(file, framework));
  // Vue links to pages without a Vue version go to the React docs
  const base =
    dir === 'docs/core/' && framework === 'vue' && !vueIds.has(docId) ?
      bases.react
    : bases[framework];
  return `${base}${docId}`.replace(/\/index$/, '/');
});

/** Relative doc links become site routes; absolute ones are left to remarkFramework */
function routeLink(url, file, framework) {
  if (/^([a-z]+:|#|\/)/i.test(url)) return url;
  const [, target = '', hash = ''] = url.match(/^([^#?]*)(.*)$/);
  const resolved = path.resolve(path.dirname(file), decodeURI(target));
  const doc = [resolved, `${resolved}.md`, `${resolved}.mdx`].find(
    f => MD.test(f) && exists(f),
  );
  if (doc) return routeOf(doc, framework) + hash;
  // site-relative link to a page without an extension
  const route = routeOf(file, framework);
  return route ?
      path.posix.join(path.posix.dirname(route), target) + hash
    : url;
}

/** Evaluates an MDX expression (JSX attribute or `{...}`) with the partial's props */
function evaluate(expression, props, file) {
  try {
    return new Function('props', `return (${expression});`)(props);
  } catch (error) {
    throw new Error(
      `${rel(file)}: can't evaluate {${expression}}: ${error.message}`,
    );
  }
}

function attrValue(attribute, props, file) {
  if (attribute.value === null) return true;
  if (typeof attribute.value === 'string') return attribute.value;
  return evaluate(attribute.value.value, props, file);
}

/** JSX attributes, evaluated when read (others may use the page's imports) */
function attributesOf(node, props, file) {
  const attrs = {};
  for (const attribute of node.attributes ?? []) {
    if (attribute.type === 'mdxJsxExpressionAttribute') {
      // spread, e.g. a partial forwarding `{...props}`
      Object.assign(attrs, evaluate(`{${attribute.value}}`, props, file));
      continue;
    }
    if (attribute.type !== 'mdxJsxAttribute') continue;
    Object.defineProperty(attrs, attribute.name, {
      enumerable: true,
      get: () => attrValue(attribute, props, file),
    });
  }
  return attrs;
}

const text = value => ({ type: 'text', value });
const paragraph = children => ({ type: 'paragraph', children });
const html = value => ({ type: 'html', value });

/** Code without Docusaurus-only syntax (highlight markers, display options) */
function codeBlock({ lang, value, title, meta = title && `title="${title}"` }) {
  return {
    type: 'code',
    lang: lang ?? null,
    meta:
      meta?.replace(/\s*\b(collapsed|showLineNumbers)\b/g, '').trim() || null,
    value: value
      .split('\n')
      .filter(
        l =>
          !/^\s*(\/\/|#|<!--|\{\/\*)\s*highlight-(next-line|start|end)/.test(l),
      )
      .join('\n')
      .trim(),
  };
}
const codeLang = attrs =>
  attrs.language ?? attrs.className?.replace(/^language-/, '');

/** Text inside JSX children, e.g. a CodeBlock's template literal */
function jsxText(children, props, file) {
  return children
    .map(child => {
      if (
        child.type === 'mdxFlowExpression' ||
        child.type === 'mdxTextExpression'
      )
        return String(evaluate(child.value, props, file) ?? '');
      if (child.type === 'text') return child.value;
      if (child.children) return jsxText(child.children, props, file);
      return '';
    })
    .join('');
}

const ADMONITIONS = ['note', 'tip', 'info', 'warning', 'danger', 'caution'];
/** Inline HTML with a markdown equivalent */
const INLINE = { b: 'strong', strong: 'strong', em: 'emphasis', i: 'emphasis' };
/** HTML kept as is around its converted children */
const HTML = ['details', 'sup', 'sub', 'kbd'];
/** Site-only embeds with nothing to read */
const DROP = ['ThemedImage', 'SkillTabs', 'head'];

/** Rewrites one page (and its partials) into plain markdown nodes */
function render(file, framework, props = {}) {
  const content = contentFor(file, framework);
  if (!pageFrameworks(content).includes(framework)) return;
  const source = sourceFor(file, framework);
  const parsed = parse(source);
  const tree = structuredClone(parsed.tree);
  remarkFramework({ framework })(tree);
  const partials = {};
  const tabLabels = [];

  function convert(node) {
    switch (node.type) {
      case 'yaml':
        return [];
      case 'mdxjsEsm': {
        for (const statement of node.data.estree.body) {
          if (
            statement.type === 'ImportDeclaration' &&
            MD.test(statement.source.value)
          )
            partials[statement.specifiers[0].local.name] = path.resolve(
              path.dirname(source),
              statement.source.value.replace(/\\/g, ''),
            );
        }
        return [];
      }
      case 'mdxFlowExpression':
      case 'mdxTextExpression': {
        const [statement] = node.data.estree.body;
        // comments
        if (!statement) return [];
        return convertEstree(statement.expression);
      }
      case 'link':
      case 'definition':
        node.url = routeLink(node.url, source, framework);
        break;
      case 'code':
        return [codeBlock(node)];
      case 'containerDirective': {
        if (!ADMONITIONS.includes(node.name)) break;
        const [first] = node.children;
        const label = first?.data?.directiveLabel ? first.children : [];
        const kind = node.name[0].toUpperCase() + node.name.slice(1);
        return [
          {
            type: 'blockquote',
            children: [
              paragraph([
                {
                  type: 'strong',
                  children: [
                    text(kind),
                    ...(label.length ? [text(': '), ...label] : []),
                  ],
                },
              ]),
              ...convertAll(node.children.filter(c => !c.data?.directiveLabel)),
            ],
          },
        ];
      }
      case 'textDirective':
      case 'leafDirective':
        // `word:thing` that isn't a directive; restore it as written
        return [text(`:${node.name}`), ...convertAll(node.children)];
      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement':
        return convertJsx(node);
    }
    if (node.children) node.children = convertAll(node.children);
    return [node];
  }

  /** `{cond ? <CodeBlock>..</CodeBlock> : ...}` in partials, picked by props */
  function convertEstree(node) {
    const run = n =>
      evaluate(parsed.input.slice(n.start, n.end), props, source);
    switch (node.type) {
      case 'ConditionalExpression':
        return convertEstree(run(node.test) ? node.consequent : node.alternate);
      case 'LogicalExpression':
        if (node.operator === '&&')
          return run(node.left) ? convertEstree(node.right) : [];
        break;
      case 'JSXFragment':
        return node.children.flatMap(convertEstree);
      case 'JSXText':
        return node.value.trim() ? [text(node.value)] : [];
      case 'JSXExpressionContainer':
        return node.expression.type === 'JSXEmptyExpression' ?
            []
          : convertEstree(node.expression);
      case 'JSXElement': {
        const name = node.openingElement.name.name;
        if (name !== 'CodeBlock')
          throw new Error(
            `${rel(source)}: unsupported <${name}> inside an expression`,
          );
        const attrs = Object.fromEntries(
          node.openingElement.attributes.map(a => [
            a.name.name,
            a.value?.type === 'Literal' ? a.value.value
            : a.value ? run(a.value.expression)
            : true,
          ]),
        );
        const value = node.children
          .map(c => (c.type === 'JSXText' ? c.value : run(c.expression)))
          .join('');
        return [
          codeBlock({ lang: codeLang(attrs), value, title: attrs.title }),
        ];
      }
    }
    const value = run(node);
    return value == null || value === false ? [] : [text(String(value))];
  }

  function convertJsx(node) {
    const { name } = node;
    if (!name || DROP.includes(name)) return [];
    const flow = node.type === 'mdxJsxFlowElement';
    const attrs = attributesOf(node, props, source);
    if (partials[name]) {
      // a partial's children are its page's code, e.g. ProviderManagers' managers
      const code = node.children.find(child => child.type === 'code');
      if (code) attrs.children = code.value;
      return render(partials[name], framework, attrs)?.children ?? [];
    }
    switch (name) {
      case 'CodeBlock':
        return [
          codeBlock({
            lang: codeLang(attrs),
            value: jsxText(node.children, props, source),
            title: attrs.title,
          }),
        ];
      case 'ProviderSetupCode': {
        const { language, code, title } = providerSetup({
          platform: attrs.platform,
          imports: attrs.imports,
          managers: attrs.children,
        });
        return [codeBlock({ lang: language, value: code, title })];
      }
      case 'PkgTabs':
      case 'PkgInstall':
        return [
          codeBlock({
            lang: 'bash',
            value: `npm install${attrs.dev ? ' --save-dev' : ''} ${attrs.pkgs}`,
          }),
        ];
      case 'StackBlitz': {
        if (!attrs.app) return [];
        const base = `https://github.com/reactive/${attrs.repo ?? 'data-client'}/tree/master/examples/${attrs.app}`;
        const files = (attrs.file ?? '').split(',').filter(Boolean);
        return [
          paragraph([
            text('Example app: '),
            { type: 'link', url: base, children: [text(attrs.app)] },
            ...files.flatMap((f, i) => [
              text(i ? ', ' : ' ('),
              {
                type: 'link',
                url: `${base.replace('/tree/', '/blob/')}/${f}`,
                children: [{ type: 'inlineCode', value: f }],
              },
            ]),
            ...(files.length ? [text(')')] : []),
          ]),
        ];
      }
      case 'Tabs': {
        tabLabels.push(
          Object.fromEntries((attrs.values ?? []).map(v => [v.value, v.label])),
        );
        const children = convertAll(node.children);
        tabLabels.pop();
        return children;
      }
      case 'TabItem': {
        const label =
          attrs.label ?? tabLabels.at(-1)?.[attrs.value] ?? attrs.value;
        return [
          paragraph([{ type: 'strong', children: [text(String(label))] }]),
          ...convertAll(node.children),
        ];
      }
      case 'Link':
      case 'a': {
        const link = {
          type: 'link',
          url: routeLink(attrs.to ?? attrs.href, source, framework),
          children: convertAll(node.children),
        };
        return [flow ? paragraph([link]) : link];
      }
      case 'summary':
        return [
          html(
            `<summary>${jsxText(node.children, props, source).trim()}</summary>`,
          ),
        ];
      case 'code':
        return [
          { type: 'inlineCode', value: jsxText(node.children, props, source) },
        ];
      case 'br':
        return [{ type: 'break' }];
      case 'table':
        return [convertTable(node)];
    }
    if (HTML.includes(name))
      return [
        html(`<${name}>`),
        ...convertAll(node.children),
        html(`</${name}>`),
      ];
    if (INLINE[name] && !flow)
      return [{ type: INLINE[name], children: convertAll(node.children) }];
    // Playgrounds, layout and other wrappers: keep what's inside
    return convertAll(node.children);
  }

  /** A GFM table; row and column spans repeat the cell so each row stands alone */
  function convertTable(node) {
    const jsx = n => n.type?.startsWith('mdxJsx');
    const rows = [];
    const collect = n =>
      n.name === 'tr' ? rows.push(n) : n.children?.filter(jsx).forEach(collect);
    node.children.filter(jsx).forEach(collect);
    /** column -> { cell, rows left } carried down from a rowSpan above */
    const spans = [];
    const cellContent = cell =>
      convertAll(cell.children).flatMap(c =>
        c.type === 'paragraph' ? c.children : [c],
      );
    const out = rows.map(row => {
      const cells = [];
      const take = () => {
        while (spans[cells.length]?.left > 0) {
          spans[cells.length].left--;
          cells.push(structuredClone(spans[cells.length].cell));
        }
      };
      // cells on their own lines parse into a paragraph inside the row
      const tds = row.children
        .flatMap(c => (c.type === 'paragraph' ? c.children : [c]))
        .filter(c => jsx(c) && (c.name === 'td' || c.name === 'th'));
      for (const td of tds) {
        take();
        const attrs = attributesOf(td, props, source);
        const cell = { type: 'tableCell', children: cellContent(td) };
        for (let i = 0; i < (Number(attrs.colSpan) || 1); i++) {
          if (Number(attrs.rowSpan) > 1)
            spans[cells.length] = { cell, left: Number(attrs.rowSpan) - 1 };
          cells.push(structuredClone(cell));
        }
      }
      take();
      return { type: 'tableRow', children: cells };
    });
    const width = Math.max(...out.map(r => r.children.length));
    for (const row of out)
      while (row.children.length < width)
        row.children.push({ type: 'tableCell', children: [] });
    return { type: 'table', align: [], children: out };
  }

  function convertAll(children) {
    return children.flatMap(convert);
  }

  tree.children = convertAll(tree.children);
  // absolute /docs links point at this framework's docs, as on the site
  if (framework === 'vue')
    remarkFramework({ framework, routeBasePath: 'vue', docIds: vueIds })(tree);
  tree.title = frontMatterValue(content, 'title');
  return tree;
}

const FLOW_PARENTS = ['root', 'blockquote', 'listItem'];
/** Unwrapped components can leave text directly in flow content; give it a paragraph */
function wrapPhrasing(tree) {
  visit(tree, node => {
    if (!FLOW_PARENTS.includes(node.type)) return;
    node.children = node.children.reduce((children, child) => {
      const last = children.at(-1);
      if (!phrasing(child)) children.push(child);
      else if (last?.data?.wrapped) last.children.push(child);
      else children.push({ ...paragraph([child]), data: { wrapped: true } });
      return children;
    }, []);
  });
}

/**
 * Markdown of a doc for a framework, or undefined if the page isn't in it.
 * `resolveRoute(route)` picks the URL for links to site pages (default: the site).
 */
export function docToMarkdown(
  file,
  framework,
  { resolveRoute = route => SITE + route } = {},
) {
  const tree = render(file, framework);
  if (!tree) return;
  visit(tree, ['link', 'definition'], node => {
    if (node.url.startsWith('/'))
      node.url = resolveRoute(node.url.replace(/\.mdx?(?=$|[#?])/, ''));
  });
  wrapPhrasing(tree);
  // sections left empty once embeds are dropped
  tree.children = tree.children.filter((node, i, all) => {
    const next = all[i + 1];
    return (
      node.type !== 'heading' ||
      (next && !(next.type === 'heading' && next.depth <= node.depth))
    );
  });
  if (
    tree.title &&
    !tree.children.some(n => n.type === 'heading' && n.depth === 1)
  )
    tree.children.unshift({
      type: 'heading',
      depth: 1,
      children: [text(tree.title)],
    });
  return stringifier.stringify(tree).replace(/\n{3,}/g, '\n\n');
}
