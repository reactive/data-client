// Flow section of impact.config.mjs: register, then browse and mutate discussions, comments and the profile.
// Each mutation step times its trigger click (submit or confirm) until the UI shows the change, and counts
// the refetches it triggers.
// Steps with `fresh` check that a view shows data changed elsewhere (stale views).

const closeToast = async (page, label) => {
  const t = page.getByLabel(label).getByRole('button', { name: 'Close' });
  if (await t.isVisible().catch(() => false)) await t.click();
};
const listReady = ({ page }) =>
  page.getByRole('button', { name: 'Create Discussion' }).waitFor();
const row = (page, text) => page.getByRole('row', { name: new RegExp(text) });
const submit = page => page.getByRole('button', { name: 'Submit' });
const confirm = (page, name) =>
  page.getByRole('dialog').getByRole('button', { name });

export default {
  isData: url => url.startsWith('https://api.bulletproofapp.com'),
  // Page-level and Suspense spinners; button spinners are part of the submit, not a loading view.
  loading: '.animate-spin:not(button .animate-spin), .animate-pulse',
  landing: {
    path: '/',
    ready: ({ page }) =>
      page.getByRole('button', { name: 'Get started' }).waitFor(),
  },
  async setup({ page, base, uid }) {
    await page.goto(base + '/auth/register');
    await page.getByLabel('First Name').fill('F' + uid);
    await page.getByLabel('Last Name').fill('L' + uid);
    await page.getByLabel('Email Address').fill(uid + '@x.com');
    await page.getByLabel('Password').fill('password1');
    await page.getByLabel('Team Name').fill('T' + uid);
    await page.getByRole('button', { name: 'Register' }).click();
    await page.waitForURL('**/app');
    await page.getByRole('heading', { name: /Welcome/ }).waitFor();
  },
  steps: [
    {
      name: 'open discussions',
      kind: 'nav',
      run: ({ page }) =>
        page.getByRole('link', { name: 'Discussions' }).click(),
      ready: listReady,
    },
    {
      name: 'create discussion',
      kind: 'mutation',
      async prepare({ page, uid }) {
        await page.getByRole('button', { name: 'Create Discussion' }).click();
        await page.getByLabel('Title').fill('title ' + uid);
        await page.getByLabel('Body').fill('body ' + uid);
      },
      trigger: ({ page }) => submit(page),
      ready: ({ page, uid }) => row(page, 'title ' + uid).waitFor(),
    },
    {
      name: 'open discussion',
      kind: 'nav',
      prepare: ({ page }) => closeToast(page, 'Discussion Created'),
      run: ({ page, uid }) =>
        row(page, 'title ' + uid)
          .getByRole('link', { name: 'View' })
          .click(),
      ready: ({ page, uid }) => page.getByText('body ' + uid).waitFor(),
    },
    {
      name: 'update discussion',
      kind: 'mutation',
      async prepare({ page, uid }) {
        await page.getByRole('button', { name: 'Update Discussion' }).click();
        await page.getByLabel('Title').fill('renamed ' + uid);
      },
      trigger: ({ page }) => submit(page),
      // getByText, not getByRole: the open drawer hides the page from the accessibility tree.
      ready: ({ page, uid }) =>
        page
          .getByText('renamed ' + uid, { exact: true })
          .first()
          .waitFor(),
    },
    {
      name: 'create comment',
      kind: 'mutation',
      async prepare({ page, uid }) {
        await closeToast(page, 'Discussion Updated');
        await page.getByRole('button', { name: 'Create Comment' }).click();
        await page.getByLabel('Body').fill('comment ' + uid);
      },
      trigger: ({ page }) => submit(page),
      ready: ({ page, uid }) => page.getByText('comment ' + uid).waitFor(),
    },
    {
      name: 'delete comment',
      kind: 'mutation',
      async prepare({ page }) {
        await closeToast(page, 'Comment Created');
        await page.getByRole('button', { name: 'Delete Comment' }).click();
        await page
          .getByText('Are you sure you want to delete this comment?')
          .waitFor();
      },
      trigger: ({ page }) => confirm(page, 'Delete Comment'),
      ready: ({ page, uid }) =>
        page.getByText('comment ' + uid).waitFor({ state: 'hidden' }),
    },
    {
      name: 'back to list (shows rename?)',
      kind: 'nav',
      prepare: ({ page }) => closeToast(page, 'Comment Deleted'),
      run: ({ page }) =>
        page.getByRole('link', { name: 'Discussions' }).click(),
      ready: listReady,
      fresh: ({ page, uid }) => row(page, 'renamed ' + uid).isVisible(),
    },
    {
      name: 'reopen discussion (comment gone?)',
      kind: 'nav',
      run: ({ page, uid }) =>
        row(page, uid).getByRole('link', { name: 'View' }).click(),
      ready: ({ page, uid }) => page.getByText('body ' + uid).waitFor(),
      fresh: ({ page }) =>
        page.getByRole('heading', { name: 'No Comments Found' }).isVisible(),
    },
    {
      name: 'profile',
      kind: 'nav',
      prepare: ({ page }) =>
        page.getByRole('button', { name: 'Open user menu' }).click(),
      run: ({ page }) =>
        page.getByRole('menuitem', { name: 'Your Profile' }).click(),
      ready: ({ page }) =>
        page.getByRole('button', { name: 'Update Profile' }).waitFor(),
    },
    {
      name: 'update profile',
      kind: 'mutation',
      async prepare({ page, uid }) {
        await page.getByRole('button', { name: 'Update Profile' }).click();
        await page.getByLabel('First Name').fill('G' + uid);
      },
      trigger: ({ page }) => submit(page),
      ready: ({ page, uid }) =>
        page
          .getByText('G' + uid)
          .first()
          .waitFor(),
    },
    {
      name: 'dashboard (shows new name?)',
      kind: 'nav',
      prepare: ({ page }) => closeToast(page, 'User Updated'),
      run: ({ page }) => page.getByRole('link', { name: 'Dashboard' }).click(),
      ready: ({ page }) =>
        page.getByRole('heading', { name: /Welcome/ }).waitFor(),
      fresh: ({ page, uid }) =>
        page.getByRole('heading', { name: new RegExp('G' + uid) }).isVisible(),
    },
    {
      name: 'list again',
      kind: 'nav',
      run: ({ page }) =>
        page.getByRole('link', { name: 'Discussions' }).click(),
      ready: listReady,
      fresh: ({ page, uid }) => row(page, 'renamed ' + uid).isVisible(),
    },
    {
      name: 'delete discussion',
      kind: 'mutation',
      async prepare({ page, uid }) {
        // Match by uid: a stale list may still show the old title.
        await row(page, uid)
          .getByRole('button', { name: 'Delete Discussion' })
          .click();
      },
      trigger: ({ page }) => confirm(page, 'Delete Discussion'),
      // A CSS locator, not getByRole: the open dialog hides the row from the accessibility tree, so a
      // role locator would count it as hidden before the delete finishes.
      ready: ({ page, uid }) =>
        page.locator('tr', { hasText: uid }).waitFor({ state: 'hidden' }),
    },
  ],
};
