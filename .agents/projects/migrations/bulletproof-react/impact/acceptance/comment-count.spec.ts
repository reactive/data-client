import { expect, test, type Page } from '@playwright/test';

const uid = Math.random().toString(36).slice(2, 8);
const title = `count ${uid}`;

async function countCell(page: Page) {
  await expect(
    page.getByRole('columnheader', { name: 'Comments', exact: true }),
  ).toBeVisible();
  const headers = await page.getByRole('columnheader').allInnerTexts();
  const col = headers.findIndex(h => h.trim() === 'Comments');
  expect(col, 'a "Comments" column header').toBeGreaterThanOrEqual(0);
  return page
    .getByRole('row', { name: new RegExp(title) })
    .getByRole('cell')
    .nth(col);
}

async function toList(page: Page) {
  await page.getByRole('link', { name: 'Discussions' }).click();
  await page.waitForURL('**/app/discussions');
}

test('comment counts stay in sync after creating and deleting a comment', async ({
  page,
}) => {
  await page.goto('/auth/register');
  await page.getByLabel('First Name').fill('F' + uid);
  await page.getByLabel('Last Name').fill('L' + uid);
  await page.getByLabel('Email Address').fill(uid + '@x.com');
  await page.getByLabel('Password').fill('password1');
  await page.getByLabel('Team Name').fill('T' + uid);
  await page.getByRole('button', { name: 'Register' }).click();
  await page.waitForURL('**/app');

  await toList(page);
  await page.getByRole('button', { name: 'Create Discussion' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Body').fill('body');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(await countCell(page)).toHaveText(/\b0\b/);

  await page
    .getByRole('row', { name: new RegExp(title) })
    .getByRole('link', { name: 'View' })
    .click();
  await expect(page.getByText(/\b0 comments\b/i)).toBeVisible();

  await page.getByRole('button', { name: 'Create Comment' }).click();
  await page.getByLabel('Body').fill('comment ' + uid);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('comment ' + uid)).toBeVisible();
  await expect(page.getByText(/\b1 comment\b/i)).toBeVisible();

  await toList(page);
  await expect(await countCell(page)).toHaveText(/\b1\b/);

  await page
    .getByRole('row', { name: new RegExp(title) })
    .getByRole('link', { name: 'View' })
    .click();
  await page.getByRole('button', { name: 'Delete Comment' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete Comment' })
    .click();
  await expect(page.getByText(/\b0 comments\b/i)).toBeVisible();

  await toList(page);
  await expect(await countCell(page)).toHaveText(/\b0\b/);
});
