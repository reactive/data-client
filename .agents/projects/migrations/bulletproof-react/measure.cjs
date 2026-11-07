const { chromium } = require('/tmp/work/bulletproof-react/apps/react-vite/node_modules/playwright');
const [,, label, base, runs='7'] = process.argv;
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const res = { script: [], task: [], load: [], heap: [], reqsFlow: [], reqsByStep: null };
  for (let i = 0; i < +runs; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Performance.enable');
    const t0 = Date.now();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.getByRole('button', { name: 'Get started' }).waitFor();
    res.load.push(Date.now() - t0);
    const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
    res.script.push(m.ScriptDuration * 1000); res.task.push(m.TaskDuration * 1000); res.heap.push(m.JSHeapUsedSize / 1e6);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    // flow: register, then navigate, counting api requests
    const api = [];
    page.on('request', (r) => { if (r.url().includes('api.bulletproofapp.com')) api.push(r.method() + ' ' + r.url().replace('https://api.bulletproofapp.com', '')); });
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.waitForURL('**/auth/login');
    await page.getByRole('link', { name: 'Register' }).click();
    const n = Math.random().toString(36).slice(2, 8);
    await page.getByLabel('First Name').fill('F' + n);
    await page.getByLabel('Last Name').fill('L' + n);
    await page.getByLabel('Email Address').fill(n + '@x.com');
    await page.getByLabel('Password').fill('password1');
    await page.getByLabel('Team Name').fill('T' + n);
    await page.getByRole('button', { name: 'Register' }).click();
    await page.waitForURL('**/app');
    await page.getByRole('heading', { name: /Welcome/ }).waitFor().catch(()=>{});
    const mark = () => api.length;
    const steps = {};
    let s = mark();
    const step = async (name, fn) => { const b = api.length; await fn(); await page.waitForTimeout(1500); steps[name] = api.slice(b); };
    await step('discussions', async () => { await page.getByRole('link', { name: 'Discussions' }).click(); });
    await step('create', async () => {
      await page.getByRole('button', { name: 'Create Discussion' }).click();
      await page.getByLabel('Title').fill('t' + n); await page.getByLabel('Body').fill('b' + n);
      await page.getByRole('button', { name: 'Submit' }).click();
    });
    await step('view', async () => { await page.getByRole('link', { name: 'View' }).first().click(); });
    await step('back to list', async () => { await page.getByRole('link', { name: 'Discussions' }).click(); });
    await step('view again', async () => { await page.getByRole('link', { name: 'View' }).first().click(); });
    await step('back again', async () => { await page.getByRole('link', { name: 'Discussions' }).click(); });
    await step('dashboard and back', async () => { await page.getByRole('link', { name: 'Dashboard' }).click(); await page.waitForTimeout(300); await page.getByRole('link', { name: 'Discussions' }).click(); });
    res.reqsFlow.push(api.length); res.reqsByStep = Object.fromEntries(Object.entries(steps).map(([k, v]) => [k, v.length]));
    await ctx.close();
  }
  console.log(JSON.stringify({ label, runs: +runs, landing_load_ms_median: med(res.load), script_ms_median: +med(res.script).toFixed(1), task_ms_median: +med(res.task).toFixed(1), heap_mb_median: +med(res.heap).toFixed(2), api_requests_flow_median: med(res.reqsFlow), requests_by_step_last_run: res.reqsByStep }, null, 1));
  await browser.close();
})();
