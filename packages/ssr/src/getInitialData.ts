const getInitialData = (id = 'rest-hooks-data') => {
  return new Promise<any>((resolve, reject) => {
    let el: HTMLScriptElement | null;
    if ((el = document.getElementById(id) as any)) {
      resolve(getDataFromEl(el, id));
      return;
    }
    document.addEventListener('DOMContentLoaded', () => {
      el = document.getElementById(id) as any;
      if (el) resolve(getDataFromEl(el, id));
      else reject(new Error('failed to find DOM with rest hooks state'));
    });
  });
};

function getDataFromEl(el: HTMLScriptElement, key: string) {
  if (el.text === undefined) {
    console.error(
      `#${key} is completely empty. This could be due to CSP issues.`,
    );
  }
  return el?.text ? JSON.parse(el?.text) : undefined;
}

export default getInitialData;
