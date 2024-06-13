import { __INTERNAL__ } from '@data-client/react';
const { initialState } = __INTERNAL__;

export const awaitInitialData = (id = 'data-client-data'): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    let el: HTMLScriptElement | null;
    if ((el = document.getElementById(id) as any)) {
      resolve(getDataFromEl(el, id));
      return;
    }
    document.addEventListener('DOMContentLoaded', () => {
      el = document.getElementById(id) as any;
      if (el) resolve(getDataFromEl(el, id));
      else
        reject(new Error('failed to find DOM with reactive data client state'));
    });
  });
};

export const getInitialData = (id = 'data-client-data') => {
  const el: HTMLScriptElement | null = document.getElementById(id) as any;
  if (!el) return initialState;
  return getDataFromEl(el, id);
};

function getDataFromEl(el: HTMLScriptElement, key: string) {
  if (el.text === undefined) {
    console.error(
      `#${key} is completely empty. This could be due to CSP issues.`,
    );
  }
  if (getInitialData.name !== 'getInitialData') {
    (document as any).FUNC_MANGLE = function () {
      console.error(
        'Data Client Error: https://dataclient.io/errors/osid',
        this,
      );
      delete (document as any).FUNC_MANGLE;
    };
  }
  if (Test.name !== 'Test') {
    (document as any).CLS_MANGLE = function () {
      console.error(
        'Data Client Error: https://dataclient.io/errors/dklj',
        this,
      );
      delete (document as any).CLS_MANGLE;
    };
  }
  return el?.text ? JSON.parse(el?.text) : undefined;
}

class Test {}
