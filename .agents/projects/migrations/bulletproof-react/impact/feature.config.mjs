// Feature section of impact.config.mjs: the same feature request on both checkouts.
// The acceptance files are copied in only after the agent finishes.
export default {
  title: 'Comment counts that stay in sync',
  prompt: `In apps/react-vite, add comment counts to discussions.

- The discussions API (mock handlers in src/testing/mocks) returns a commentCount number for each discussion, in both the list and the single-discussion responses.
- The discussions table gets a column with the header "Comments" showing that number.
- The discussion page shows "N comments" (for example "0 comments", "1 comment", "2 comments") next to the title.
- Both stay correct right after a user creates or deletes a comment, including when they navigate back to the list with the sidebar link, without a page reload.

Keep the existing tests passing (npx tsc --noEmit and npx vitest run). Do not start dev servers or browsers.
Change files only with the Edit and Write tools. Shell commands are limited to reading files, npx tsc, npx vitest and npx prettier; anything else is refused.`,
  acceptanceFiles: {
    'impact.playwright.config.ts': 'acceptance/impact.playwright.config.ts',
    'e2e/impact-comment-count.spec.ts': 'acceptance/comment-count.spec.ts',
  },
  acceptance:
    'npx tsc --noEmit && npx playwright test -c impact.playwright.config.ts',
};
