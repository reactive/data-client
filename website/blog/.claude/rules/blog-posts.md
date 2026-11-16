---
paths:
  - "**"
---
<!-- Generated from website/blog/.cursor/rules/blog-posts.mdc by `yarn build:agent-rules`. Edit the source. -->


## Naming Convention

Files: `YYYY-MM-DD-vX.Y-short-description.md`

## Frontmatter

- Title format: `vX.Y: Feature1, Feature2, Feature3` or `vX.Y Feature-focused Title`
- Include `releases` tag plus relevant feature tags from [tags.yml](./tags.yml)
- `draft: true` for unpublished/WIP posts
- Publish a draft with `yarn blog:publish website/blog/<post>.md` (removes `draft: true`, re-dates the filename to today, fixes links). CI fails posts published with a stale date.

## Blog Structure

Group changes by the concept a reader cares about (live data, performance, type safety, Vue, testing), not by package
or by "new" versus "fixed". A reader should find their group from its heading and skip the rest.

**Summary (before `{/* truncate */}`):**
1. One or two sentences on the release's headline changes
2. One block per concept group, most important first: a bold heading linking to its body section, one sentence on why
   it matters to the reader, then 1-4 short bullets linking to sections
3. Breaking Changes, grouped by audience (as in the migration guide), with anchor links
4. Get ready for future releases (deprecations)

**Details (after truncate):** one `##` per concept group, in summary order, then the migration guide.
- Open each group with its why sentence.
- Give a change its own `###` when it needs a demo or code: explanation → code example → PR/commit links.
- List smaller fixes as a final bullet list in their group, each with its PR link. Put it under `### Other fixes`
  when the group also has `###` sections.

## Migration Guide

Start with `<PkgTabs pkgs="..." upgrade />`, end with Upgrade support blurb.

Group changes by who's affected, each change as a `####` under its audience:
- `### For all users`
- `### For custom Manager authors {#custom-managers}` - Action/middleware changes
- `### For custom Schema authors {#custom-schemas}` - normalize/denormalize changes
- `### For test authors` - @data-client/test and fixture changes

Add skip guidance for specialized sections: "Skip this section if you don't have custom [Managers](/docs/concepts/managers)."

Use `<DiffEditor>` for before/after. End with:

```md
### Upgrade support

As usual, if you have any troubles or questions, feel free to join our [![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/wXGV27xm6t) or [file a bug](https://github.com/reactive/data-client/issues/new/choose)
```

## Components

| Component | Use For |
|-----------|---------|
| `<HooksPlayground>` | Interactive demos with fixtures |
| `<StackBlitz>` | Embedded app demos (todo-app, coin-app) |
| `<TypeScriptEditor>` | Type-safe code examples |
| `<DiffEditor>` | Before/After migration changes (with `caption` and `// callout:` annotations) |
| `<PkgTabs pkgs="..." upgrade />` | Package installation |
| `<AutoPlayVideo>` | Recorded clips (SSR/navigation, DevTools). Record with [scripts/videos](../../scripts/videos/README.md); pass `alt` and put the code it shows in a fenced block next to it |

## DiffEditor Annotations

Let the diff carry its reason instead of a paragraph of prose above it:

- `caption="..."` - one line on why the change is needed, shown above the diff. Backticks render as code.
- `// callout: reason` - on its own line inside a fence; annotates the next code line with a numbered marker (①, ②, …) and lists the reason under the diff. Consecutive `// callout:` lines join into one callout. Use for the *why* of a specific line, instead of trailing code comments that would show up in the diff.

````mdx
<DiffEditor caption="The codemod cannot infer this dependency, so update these schemas by hand.">

```ts title="After"
class LensSchema {
  constructor({ lens }) {
    // callout: The function reference is the cache key, so set it once here.
    this.lensSelector = lens;
  }
}
```

</DiffEditor>
````

Caption and callout text render as plain HTML outside the editor, so they are in the static page for search engines. Keep each to one sentence; anything longer belongs in the prose.

## Performance Sections

1. Explain what was optimized
2. Quantify with multipliers ("2x", "16x")
3. Link PR and docs
4. Visualize with `<PerfChart>`, not mermaid `xychart-beta` (it has no legend, so overlaid bars are unlabeled)
5. Link to [benchmarks](https://reactive.github.io/data-client/dev/bench/)

`<PerfChart>` renders a bar chart of each row's speedup. The raw numbers appear on hover or tap, and stay in the
page text for crawlers and screen readers. Pass raw measurements, not percentages; the component computes the multiplier.

```mdx
import PerfChart from '@site/src/components/PerfChart';

<PerfChart
  title="Writing rows into a 500-entity store"
  baselineLabel="One set() per row"
  valueLabel="set([Ticker], rows)"
  rows={[
    { label: '50 rows', baseline: 10.8, value: 0.54 },
    { label: '500 rows', baseline: 103, value: 1.08 },
  ]}
/>
```

`unit` defaults to `ms`, with lower being better; set `higherIsBetter` and `unit="ops/sec"` for throughput.
Bar lengths switch to a log scale on their own when speedups differ by more than 10x, and the chart labels it.
Each bar is shaded up to a dashed 1x line (no change), so the bright part is the gain. A row that got slower shows a red,
dashed gap between its bar and 1x; include regressions rather than dropping them. When charts sit next to each other, pass
the same `scaleMax` (the largest speedup among them) so their 1x lines line up.

For several metrics per row (like time and memory), use `<PerfTable>` instead of a markdown table. Each cell shows
paired before/after bars and a colored percent-change badge, with exact numbers on hover or tap; lower is better.

```mdx
import PerfTable from '@site/src/components/PerfTable';

<PerfTable
  columns={[
    { label: 'Check time', unit: 's' },
    { label: 'Memory', unit: 'MB' },
  ]}
  rows={[
    { label: 'Long paths', description: '150 RestEndpoints', values: [[3.13, 1.59], [345, 207]] },
  ]}
/>
```

## Conventions

- Each change links to PR `[#1234](https://github.com/reactive/data-client/pull/1234)` and relevant docs
- Use `:::note` / `:::tip` / `:::warning` for callouts
- Use `// highlight-next-line` for code emphasis
- Imports go after frontmatter; place migration-only imports after truncate
