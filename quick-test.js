const puppeteer = require('puppeteer-core');
const fs = require('fs');

const BASE = 'https://dealflow.xenokev.workers.dev';
const DIR = '/tmp/screenshots';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5N2FjZGVhMi1jNDc0LTRhZWMtOTYwOS05YTYyN2VlZjQ3NGYiLCJyb2xlIjoib3JnYW5pemVyIiwiaWF0IjoxNzcxNDk3MDQ0LCJleHAiOjE3NzIxMDE4NDR9.tNc8C0NsQoBM3KK564SkKO03cPXxp7MwIemSfTmgyhQ';
const REFRESH = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5N2FjZGVhMi1jNDc0LTRhZWMtOTYwOS05YTYyN2VlZjQ3NGYiLCJyb2xlIjoib3JnYW5pemVyIiwiaWF0IjoxNzcxNDk3MDQ0LCJleHAiOjE3NzQwODkwNDR9.2tZ3dy1xhGubr9n4GKbHfQJLRQm--qHWvgaluX4Tm4Q';

async function run() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium-browser',
    headless: 'new',
    protocolTimeout: 30000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-software-rasterizer'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Set auth BEFORE any navigation
  await page.evaluateOnNewDocument((t, r) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('refreshToken', r);
  }, TOKEN, REFRESH);

  const logs = [];
  page.on('console', msg => {
    const t = msg.text();
    logs.push(t);
    if (t.includes('[IC]') || t.includes('[AUTH]')) console.log('BROWSER:', t.substring(0, 200));
  });
  page.on('pageerror', err => console.log('PAGE_ERR:', err.message.substring(0, 200)));

  // Navigate DIRECTLY to IC config (no prior page visit)
  console.log('Direct navigate to IC config...');
  await page.goto(
    `${BASE}/organizer/events/4cb9f6b8-b93a-4eba-a8fc-ae72ba31a031/ic-config`,
    { waitUntil: 'load', timeout: 30000 }
  );
  console.log('Page loaded.');

  for (let i = 1; i <= 10; i++) {
    await sleep(3000);
    try {
      const result = await page.evaluate(() => {
        const el = document.querySelector('[data-testid]');
        return {
          testId: el?.getAttribute('data-testid') || null,
          url: window.location.href,
          bodyLen: document.body.innerText.length,
        };
      });
      console.log(`Poll ${i} (${i*3}s): testId=${result.testId}, url=${result.url.substring(result.url.indexOf('.dev') + 4)}, bodyLen=${result.bodyLen}`);
      if (result.testId === 'content') {
        console.log('SUCCESS!');
        break;
      }
    } catch(e) {
      console.log(`Poll ${i}: TIMEOUT`);
    }
  }

  try {
    await page.screenshot({ path: `${DIR}/08_ic_config.png`, fullPage: true });
    console.log('Screenshot saved');
  } catch {}

  console.log('\nLogs with IC:', logs.filter(l => l.includes('[IC]')).join(' | '));
  await browser.close();
  console.log('DONE');
}

run().catch(err => { console.error('Fatal:', err.message.substring(0, 200)); process.exit(1); });
