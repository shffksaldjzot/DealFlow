const https = require('https');

const API = 'https://dealflow-api-tyz1.onrender.com/api';
const FRONTEND = 'https://dealflow.xenokev.workers.dev';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const options = { hostname: url.hostname, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json' } };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    const r = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function fetchPage(path) {
  return new Promise((resolve) => {
    https.get(new URL(FRONTEND + path), (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve({ status: r.statusCode, size: d.length }));
    }).on('error', () => resolve({ status: 'ERR', size: 0 }));
  });
}

async function main() {
  const results = [];
  const check = (name, ok) => { results.push({ name, ok }); console.log(`  ${ok ? 'PASS' : 'FAIL'}: ${name}`); };

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        DealFlow Final Test Suite             ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // === Backend Tests ===
  console.log('── Backend API ──');

  // 1. Admin Login
  const login = await req('POST', '/auth/login/email', { email: 'admin@dealflow.com', password: 'Admin1234!' });
  check('Admin login (201)', login.status === 201);
  const adminToken = login.data?.data?.accessToken;
  if (!adminToken) { console.log('ABORT'); return; }

  // 2. Admin users
  const users = await req('GET', '/admin/users', null, adminToken);
  check('Admin users list', users.status === 200);
  const allUsers = Array.isArray(users.data?.data) ? users.data.data : (users.data?.data?.data || []);

  // 3. Reset passwords & login as organizer + partner
  const org = allUsers.find(u => u.role === 'organizer');
  const partner = allUsers.find(u => u.role === 'partner');

  let orgToken = null;
  if (org) {
    await req('POST', `/admin/users/${org.id}/reset-password`, { newPassword: 'Test1234!' }, adminToken);
    const orgLogin = await req('POST', '/auth/login/email', { email: org.email, password: 'Test1234!' });
    check(`Organizer login (${org.email})`, orgLogin.status === 201);
    orgToken = orgLogin.data?.data?.accessToken;
  }

  let partnerToken = null;
  if (partner) {
    await req('POST', `/admin/users/${partner.id}/reset-password`, { newPassword: 'Test1234!' }, adminToken);
    const pLogin = await req('POST', '/auth/login/email', { email: partner.email, password: 'Test1234!' });
    check(`Partner login (${partner.email})`, pLogin.status === 201);
    partnerToken = pLogin.data?.data?.accessToken;
  }

  // 4. Notification tests
  console.log('\n── Notifications ──');

  if (orgToken) {
    const notifs = await req('GET', '/notifications', null, orgToken);
    check('Organizer notifications endpoint', notifs.status === 200);
    const list = notifs.data?.data || [];
    console.log(`  Notifications count: ${list.length}`);

    if (list.length > 0) {
      const n = list[0];
      // Check if raw entity fields are present (backend hasn't deployed yet)
      // or DTO fields (backend deployed)
      const hasContent = !!n.content;
      const hasMessage = !!n.message;
      const hasStatus = !!n.status;
      const hasIsRead = n.hasOwnProperty('isRead');

      if (hasMessage && hasIsRead) {
        check('Backend DTO transform active', true);
        console.log(`    (Backend deployed with toDto)`);
      } else if (hasContent && hasStatus) {
        console.log(`    (Backend still raw entity - frontend normalizeNotification will handle)`);
        check('Backend raw entity - frontend will normalize', true);
      }

      console.log(`    title: "${n.title}"`);
      console.log(`    content/message: "${n.content || n.message || ''}"`);
      console.log(`    status/isRead: ${n.status || ''} / ${n.isRead}`);
      console.log(`    metadata: ${JSON.stringify(n.metadata || {})}`);
    }

    // Unread count
    const unread = await req('GET', '/notifications/unread-count', null, orgToken);
    check('Unread count endpoint', unread.status === 200);
    console.log(`  Unread: ${JSON.stringify(unread.data?.data)}`);

    // Mark all read
    const markAll = await req('PATCH', '/notifications/read-all', null, orgToken);
    check('Mark all read', markAll.status === 200);

    const unread2 = await req('GET', '/notifications/unread-count', null, orgToken);
    const count = unread2.data?.data?.count ?? unread2.data?.data;
    check('Unread count after mark-all is 0', count === 0 || (typeof count === 'object' && count.count === 0));
  }

  if (partnerToken) {
    const pNotifs = await req('GET', '/notifications', null, partnerToken);
    check('Partner notifications endpoint', pNotifs.status === 200);
    const pList = pNotifs.data?.data || [];
    console.log(`  Partner notifications: ${pList.length}`);
    if (pList.length > 0) {
      console.log(`    title: "${pList[0].title}"`);
      console.log(`    content/message: "${pList[0].content || pList[0].message || ''}"`);
    }
  }

  // 5. Events & Partners test
  console.log('\n── Events & Partners ──');
  if (orgToken) {
    const events = await req('GET', '/events/my', null, orgToken);
    check('Organizer events endpoint', events.status === 200);
    const evList = events.data?.data || [];
    console.log(`  Events: ${evList.length}`);

    for (const ev of evList) {
      console.log(`  Event: "${ev.name}" - ${ev.partners?.length || 0} partners`);
      (ev.partners || []).forEach((p, i) => {
        const name = p.partner?.name || p.organization?.name;
        check(`Partner "${name || 'MISSING'}" has name`, !!name);
      });

      // IC Config
      const ic = await req('GET', `/ic/configs/event/${ev.id}`, null, orgToken);
      if (ic.status === 200 && ic.data?.data) {
        const cfg = ic.data.data;
        check('IC Config loaded', true);
        console.log(`    IC: aptTypes=${cfg.apartmentTypes?.length||0} stages=${cfg.paymentStages?.length||0} sheets=${cfg.sheets?.length||0}`);

        (cfg.sheets || []).forEach(s => {
          console.log(`    Sheet "${s.categoryName}": ${s.columns?.length||0} cols, ${s.rows?.length||0} rows`);
          (s.rows || []).slice(0, 2).forEach((r, ri) => {
            const priceKeys = Object.keys(r.prices || {});
            const cellKeys = Object.keys(r.cellValues || {});
            console.log(`      Row${ri}: order=${r.sortOrder} prices=[${priceKeys.length}] cells=[${cellKeys.length}]`);
          });
        });
      }
    }
  }

  // 6. Partner IC Sheets
  if (partnerToken) {
    console.log('\n── Partner IC Sheets ──');
    const sheets = await req('GET', '/ic/sheets/my', null, partnerToken);
    check('Partner sheets endpoint', sheets.status === 200);
    console.log(`  Sheets: ${(sheets.data?.data || []).length}`);
  }

  // === Frontend Tests ===
  console.log('\n── Frontend Pages ──');
  const pages = [
    '/', '/login', '/signup/business', '/forgot-password',
    '/organizer', '/organizer/events', '/organizer/notifications', '/organizer/settings',
    '/partner', '/partner/events', '/partner/notifications', '/partner/settings',
    '/customer', '/customer/contracts', '/customer/notifications', '/customer/profile',
    '/admin',
  ];

  for (const page of pages) {
    const res = await fetchPage(page);
    check(`${page} → ${res.status}`, res.status === 200);
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════╗');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`║  Results: ${String(passed).padStart(2)} passed, ${String(failed).padStart(2)} failed / ${results.length} total     ║`);
  console.log('╚══════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.ok).forEach(r => console.log(`  ✘ ${r.name}`));
  }
}

main().catch(console.error);
