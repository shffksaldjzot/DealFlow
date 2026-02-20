const puppeteer = require('puppeteer-core');

const BASE = 'https://dealflow.xenokev.workers.dev';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5N2FjZGVhMi1jNDc0LTRhZWMtOTYwOS05YTYyN2VlZjQ3NGYiLCJyb2xlIjoib3JnYW5pemVyIiwiaWF0IjoxNzcxNDk3MDQ0LCJleHAiOjE3NzIxMDE4NDR9.tNc8C0NsQoBM3KK564SkKO03cPXxp7MwIemSfTmgyhQ';
const REFRESH = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5N2FjZGVhMi1jNDc0LTRhZWMtOTYwOS05YTYyN2VlZjQ3NGYiLCJyb2xlIjoib3JnYW5pemVyIiwiaWF0IjoxNzcxNDk3MDQ0LCJleHAiOjE3NzQwODkwNDR9.2tZ3dy1xhGubr9n4GKbHfQJLRQm--qHWvgaluX4Tm4Q';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium-browser',
    headless: 'new',
    protocolTimeout: 60000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  await page.evaluateOnNewDocument((t, r) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('refreshToken', r);
  }, TOKEN, REFRESH);

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('[IC]')) console.log('BROWSER:', t.substring(0, 200));
  });
  page.on('pageerror', err => console.log('PAGE_ERR:', err.message.substring(0, 200)));

  console.log('Navigate...');
  await page.goto(
    `${BASE}/organizer/events/4cb9f6b8-b93a-4eba-a8fc-ae72ba31a031/ic-config`,
    { waitUntil: 'load', timeout: 30000 }
  );
  console.log('Loaded.');

  for (let i = 1; i <= 12; i++) {
    await sleep(2000);
    try {
      const r = await page.evaluate(() => ({
        testId: document.querySelector('[data-testid]')?.getAttribute('data-testid'),
        body: document.body?.innerText?.substring(0, 80),
        url: window.location.pathname,
      }));
      console.log(`Poll ${i}: testId=${r.testId}, url=${r.url}, body="${r.body}"`);
      if (r.testId === 'content') { console.log('SUCCESS'); break; }
    } catch(e) {
      console.log(`Poll ${i}: BLOCKED - ${e.message.substring(0, 80)}`);
    }
  }

  await browser.close();
  console.log('DONE');
}

run().catch(err => { console.error('Fatal:', err.message.substring(0, 200)); process.exit(1); });
