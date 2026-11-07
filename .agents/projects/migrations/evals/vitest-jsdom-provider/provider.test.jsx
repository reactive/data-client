import { DataProvider } from '@data-client/react';
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';

test('DataProvider renders under vitest + jsdom', () => {
  const { container } = render(
    <DataProvider>
      <div>ok</div>
    </DataProvider>,
  );
  expect(container.textContent).toBe('ok');
});
