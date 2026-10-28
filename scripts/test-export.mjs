// 通过 CDP 打开页面并等待导出结果，验证 WebCodecs 导出链路
const PORT = 9333;
const PAGE_URL = process.argv[2] || 'http://127.0.0.1:4174/?export=1';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* 等 Chrome 起来 */
    }
    await sleep(500);
  }
  throw new Error('找不到调试目标');
}

const main = async () => {
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, {resolve, reject});
      ws.send(JSON.stringify({id: msgId, method, params}));
    });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const {resolve, reject} = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', {url: PAGE_URL});

  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', {expression: expr, returnByValue: true, awaitPromise: true});
    return r.result?.value;
  };

  const started = Date.now();
  let text = '';
  while (Date.now() - started < 180000) {
    text = await evaluate("document.getElementById('export-status')?.textContent || ''");
    if (text.includes('导出完成') || text.includes('导出失败')) break;
    await sleep(1000);
  }

  console.log('STATUS:', text);
  console.log('ELAPSED:', Math.round((Date.now() - started) / 1000) + 's');
  const info = await evaluate(
    "JSON.stringify({ua: navigator.userAgent.includes('Headless'), hasVC: typeof VideoEncoder !== 'undefined'})"
  );
  console.log('INFO:', info);
  ws.close();
  process.exit(text.includes('导出完成') ? 0 : 1);
};

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(2);
});
