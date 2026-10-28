// CDP 冒烟测试：截图三种画幅 + 竖屏导出
const PORT = 9333;
const URL = process.argv[2] || 'http://127.0.0.1:4175/';
const OUT = process.argv[3] || 'E:\\video\\studio\\.tmp';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fs = await import('node:fs');
const path = await import('node:path');

const getTarget = async () => {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* 等 */
    }
    await sleep(500);
  }
  throw new Error('no target');
};

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, {resolve, reject});
    ws.send(JSON.stringify({id: mid, method, params}));
  });
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const {resolve, reject} = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
await new Promise((r) => ws.addEventListener('open', r));
await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', {url: URL});
await sleep(3500);

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result?.value;
};

const shot = async (name) => {
  const r = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true});
  fs.mkdirSync(OUT, {recursive: true});
  fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
  console.log('shot:', name);
};

const clickText = async (text) =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(text)}));
    if (!el) return 'not-found';
    el.click();
    return 'clicked';
  })()`);

await shot('shot-169.png');
console.log('portrait:', await clickText('竖屏'));
await sleep(1800);
await shot('shot-916.png');

console.log('export click:', await clickText('导出 MP4'));
const started = Date.now();
let text = '';
while (Date.now() - started < 180000) {
  text = await evaluate("document.getElementById('export-status')?.textContent || ''");
  if (text.includes('导出完成') || text.includes('导出失败')) break;
  await sleep(1000);
}
console.log('EXPORT:', text);
await shot('shot-after-export.png');
ws.close();
process.exit(text.includes('导出完成') ? 0 : 1);
