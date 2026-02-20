const puppeteer = require('puppeteer-core');
const fs = require('fs');

const BASE = 'https://dealflow.xenokev.workers.dev';
const DIR = '/tmp/screenshots';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Fresh auth tokens
const ORGANIZER = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5N2FjZGVhMi1jNDc0LTRhZWMtOTYwOS05YTYyN2VlZjQ3NGYiLCJyb2xlIjoib3JnYW5pemVyIiwiaWF0IjoxNzcxNDk3MDQ0LCJleHAiOjE3NzIxMDE4NDR9.tNc8C0NsQoBM3KK564SkKO03cPXxp7MwIemSfTmgyhQ',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5N2FjZGVhMi1jNDc0LTRhZWMtOTYwOS05YTYyN2VlZjQ3NGYiLCJyb2xlIjoib3JnYW5pemVyIiwiaWF0IjoxNzcxNDk3MDQ0LCJleHAiOjE3NzQwODkwNDR9.2tZ3dy1xhGubr9n4GKbHfQJLRQm--qHWvgaluX4Tm4Q',
};
const PARTNER = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNGY5MjFmYi0yYTQ2LTQ5Y2YtYjFkNi1hNWEzYjIxMzYxOWMiLCJyb2xlIjoicGFydG5lciIsImlhdCI6MTc3MTQ5NzA0NCwiZXhwIjoxNzcyMTAxODQ0fQ.CFcoAzjdW55SSk6XGwSjE0oYX6ddh_y0XUtcxddkLJw',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNGY5MjFmYi0yYTQ2LTQ5Y2YtYjFkNi1hNWEzYjIxMzYxOWMiLCJyb2xlIjoicGFydG5lciIsImlhdCI6MTc3MTQ5NzA0NCwiZXhwIjoxNzc0MDg5MDQ0fQ.NexhJDf87su7Sjnj-grfUMG6rtmQBJArLfx5u9eUAjc',
};
const CUSTOMER = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmFlMThiMi0wZjYwLTQ5NDQtYmI0NS0yZmFkOTM3NzU5MjkiLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NzE0OTcwNDUsImV4cCI6MTc3MjEwMTg0NX0.sTaHZLZZSyGoocMJbC3afYE6OCM8h-YdrOun23O20Eo',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmFlMThiMi0wZjYwLTQ5NDQtYmI0NS0yZmFkOTM3NzU5MjkiLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NzE0OTcwNDUsImV4cCI6MTc3NDA4OTA0NX0.R-4npqqY0wunL6UymL6SSDsanWLBL0S-SWRYsj1mSBY',
};

async function run() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--font-render-hinting=none'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  const results = [];

  async function setAuth(tokens) {
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate((t) => {
      localStorage.clear();
      localStorage.setItem('accessToken', t.accessToken);
      localStorage.setItem('refreshToken', t.refreshToken);
    }, tokens);
  }

  async function snap(name, url) {
    try {
      console.log(`\n--- ${name} ---`);
      const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(3000);

      const currentUrl = page.url();
      console.log(`Status: ${resp.status()}, URL: ${currentUrl}`);

      await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });

      const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log(`Text: ${text.replace(/\n+/g, ' | ').substring(0, 300)}`);

      const redirectedToLogin = currentUrl.includes('/login');
      results.push({ name, ok: true, status: resp.status(), redirectedToLogin, url: currentUrl });
    } catch (err) {
      console.log(`FAIL: ${err.message.substring(0, 150)}`);
      results.push({ name, ok: false });
    }
  }

  // ===== 1. Login page =====
  await snap('01_login', `${BASE}/login`);

  // ===== 2. Login error test =====
  console.log('\n--- 02_login_error (testing inline error) ---');
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1000);
    // Type wrong credentials
    const emailInput = await page.$('input[type="email"]');
    const passInput = await page.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.type('wrong@test.com');
      await passInput.type('wrongpass123');
      // Click login button
      const loginBtn = await page.$('button');
      if (loginBtn) await loginBtn.click();
      await sleep(3000);
      await page.screenshot({ path: `${DIR}/02_login_error.png`, fullPage: true });
      // Check for inline error
      const hasError = await page.evaluate(() => {
        const el = document.querySelector('.bg-red-50');
        return el ? el.innerText : null;
      });
      console.log(`Login error display: ${hasError || 'NOT FOUND'}`);
      results.push({ name: '02_login_error', ok: !!hasError, status: 200, redirectedToLogin: false, url: page.url() });
    }
  } catch (err) {
    console.log(`FAIL: ${err.message.substring(0, 150)}`);
    results.push({ name: '02_login_error', ok: false });
  }

  // ===== 3. Customer Options - full price table (public) =====
  await snap('03_options_full', `${BASE}/events/LDLD3R9A/options`);

  // ===== 4. [typeId] redirect test =====
  console.log('\n--- 04_typeId_redirect ---');
  try {
    const resp = await page.goto(`${BASE}/events/LDLD3R9A/options/some-type-id`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    const currentUrl = page.url();
    const redirected = currentUrl.includes('/options') && !currentUrl.includes('some-type-id');
    console.log(`URL after redirect: ${currentUrl}, redirected: ${redirected}`);
    results.push({ name: '04_typeId_redirect', ok: redirected, status: resp.status(), redirectedToLogin: false, url: currentUrl });
  } catch (err) {
    console.log(`FAIL: ${err.message.substring(0, 150)}`);
    results.push({ name: '04_typeId_redirect', ok: false });
  }

  // ===== 5. Organizer pages =====
  console.log('\n========== ORGANIZER ==========');
  await setAuth(ORGANIZER);
  await snap('05_organizer_dashboard', `${BASE}/organizer`);
  await snap('06_organizer_events', `${BASE}/organizer/events`);
  await snap('07_event_detail', `${BASE}/organizer/events/4cb9f6b8-b93a-4eba-a8fc-ae72ba31a031`);
  await snap('08_ic_config', `${BASE}/organizer/events/4cb9f6b8-b93a-4eba-a8fc-ae72ba31a031/ic-config`);
  await snap('09_ic_contracts', `${BASE}/organizer/events/4cb9f6b8-b93a-4eba-a8fc-ae72ba31a031/ic-contracts`);

  // ===== 6. Partner pages =====
  console.log('\n========== PARTNER ==========');
  await setAuth(PARTNER);
  await snap('10_partner_events', `${BASE}/partner/events`);

  // ===== 7. Customer pages =====
  console.log('\n========== CUSTOMER ==========');
  await setAuth(CUSTOMER);
  await snap('11_customer_dashboard', `${BASE}/customer`);
  await snap('12_customer_ic_detail', `${BASE}/customer/integrated-contracts/2abf59ef-d490-46df-8988-a3516a59c7df`);

  // ===== Summary =====
  console.log('\n\n========== RESULTS ==========');
  let pass = 0, fail = 0;
  results.forEach(r => {
    const loginFlag = r.redirectedToLogin ? ' [REDIRECTED TO LOGIN]' : '';
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.name} (${r.status || 'err'})${loginFlag}`);
    if (r.ok) pass++; else fail++;
  });

  console.log(`\nTotal: ${pass} passed, ${fail} failed out of ${results.length}`);

  const authFails = results.filter(r => r.redirectedToLogin);
  if (authFails.length > 0) {
    console.log(`⚠️  ${authFails.length} pages redirected to login (auth may have failed)`);
  }

  await browser.close();
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
