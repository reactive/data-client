export const meta = {
  name: 'post-push-review',
  description:
    'Parallel Haiku review of a pushed diff: goals, engineering, adversarial, reuse, and React data flow',
  whenToUse:
    'After pushing commits. args: { range: "<base>..<head>", goals?: "extra project goals" } or just the range string. Returns unverified findings; the caller verifies each one.',
  phases: [{ title: 'Review', model: 'haiku' }],
};

const range = typeof args === 'string' ? args : args?.range;
if (!range) {
  throw new Error(
    'post-push-review needs the pushed diff range, e.g. { range: "origin/master..HEAD" }',
  );
}
const extraGoals = typeof args === 'object' ? args.goals : undefined;

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    skipped: {
      type: 'boolean',
      description: 'true only when this review does not apply to the diff',
    },
    skipReason: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'repo-relative path' },
          line: { type: 'integer' },
          severity: {
            type: 'string',
            enum: ['blocker', 'major', 'minor', 'nit'],
          },
          title: { type: 'string', description: 'one-line claim' },
          detail: {
            type: 'string',
            description:
              'evidence: the code involved and the concrete failure or the principle it breaks',
          },
          suggestion: { type: 'string', description: 'the fix' },
        },
        required: ['file', 'severity', 'title', 'detail'],
      },
    },
  },
  required: ['findings'],
};

const GOALS = `The project goals are in GOALS.md at the repo root; read it.${
  extraGoals ? `\nThis work also serves these goals:\n${extraGoals}` : ''
}`;

const brief = focus => `You are reviewing a pushed change in this repository.
Read the diff with \`git diff ${range}\` (and \`git log ${range}\` for intent), and open the surrounding code as needed.

${focus}

Rules:
- Review only what the diff changes or breaks; pre-existing problems it doesn't touch are out of scope.
- Report real problems only, each with evidence from the code. No praise, no summaries, no restating the diff.
- Return an empty findings list when you find nothing; don't invent findings to fill it.
- Do not edit files, commit, or push.`;

const REVIEWERS = [
  {
    name: 'goals',
    prompt: brief(`Focus: does the change serve the project's goals?
${GOALS}
Flag anything that works against a goal (added complexity, new runtime dependencies, bundle size, weaker data integrity or types, worse performance, harder for agents or humans to understand), and changes that miss what the commits say they set out to do.`),
  },
  {
    name: 'engineering',
    prompt: brief(`Focus: software engineering principles and clean code.
Flag: unclear naming, functions doing more than one thing or mixing levels of abstraction, logic placed away from the concept that owns it, duplication, dead or speculative code, needless configuration or indirection, missing or misleading comments where intent is non-obvious, and tests that don't cover the change's behavior.`),
  },
  {
    name: 'adversarial',
    prompt: brief(`Focus: break the change.
Actively hunt for bugs: edge cases (empty, null, very large, concurrent, repeated, out-of-order), regressions in callers of changed code, wrong assumptions about inputs or environment, error paths, SSR vs browser differences, and light/dark or mobile/desktop differences for UI. For each finding give the concrete input or sequence that triggers it and what goes wrong.`),
  },
  {
    name: 'reuse',
    prompt: brief(`Focus: reuse.
Find anything the change built that should have reused something that already exists. Search the repo (packages/, website/, examples/, scripts/) for existing helpers, components, hooks, styles, tokens and utilities that do the same job, and name the one to use with its path. Strongly prefer code already in the repo; a new external dependency (or suggesting one) needs a strong case.`),
  },
  {
    name: 'data-flow',
    prompt:
      brief(`Focus: React data flow. First check whether the diff touches React components, hooks, or component state. If it doesn't, return skipped: true with the reason and no findings.
Otherwise check for clean one-way data flow: props down, events up; no child mutating parent state; no syncing state through effects. Check state structure against https://react.dev/learn/choosing-the-state-structure: group related state, avoid contradictions, redundant or derivable state, duplication, and deep nesting.`),
  },
];

phase('Review');
const results = await parallel(
  REVIEWERS.map(
    r => () =>
      agent(r.prompt, {
        label: `review:${r.name}`,
        phase: 'Review',
        model: 'haiku',
        schema: FINDINGS_SCHEMA,
      }),
  ),
);

const reviewers = REVIEWERS.map(({ name }, i) => {
  const res = results[i];
  if (!res) return { name, status: 'failed' };
  if (res.skipped) return { name, status: 'skipped', reason: res.skipReason };
  return { name, status: 'ran', findings: res.findings };
});
const failed = reviewers.filter(r => r.status === 'failed');
if (failed.length) log(`No result from: ${failed.map(r => r.name).join(', ')}`);

return {
  range,
  reviewers: reviewers.map(({ findings, ...r }) =>
    findings ? { ...r, count: findings.length } : r,
  ),
  findings: reviewers.flatMap(({ name, findings = [] }) =>
    findings.map(f => ({ reviewer: name, ...f })),
  ),
};
