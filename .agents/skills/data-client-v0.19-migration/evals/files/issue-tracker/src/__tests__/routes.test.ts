import { Controller } from '@data-client/react';

import { Issue } from '../resources';
import { issueLoader } from '../routes';

test('sets the title from a cached issue', async () => {
  const ctrl = new Controller();
  const issue = Issue.fromJS({ id: 5, title: 'Crash on save' });
  jest.spyOn(ctrl, 'fetchIfStale').mockReturnValue(issue);
  await issueLoader(ctrl, 5);
  expect(document.title).toBe('Crash on save · Issue Tracker');
});
