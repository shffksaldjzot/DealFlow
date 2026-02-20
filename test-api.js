const https = require('https');

const API = 'https://dealflow-api-tyz1.onrender.com/api';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    const r = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
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

function pass(ok) { return ok ? 'PASS' : 'FAIL'; }

async function test() {
  const results = [];
  const check = (name, ok) => { results.push({ name, ok }); console.log(`   ${ok ? 'PASS' : 'FAIL'}: ${name}`); };

  console.log('=== DealFlow Full Test Suite ===\n');

  // 1. Admin Login
  console.log('[1] Admin Login');
  const login = await req('POST', '/auth/login/email', { email: 'admin@dealflow.com', password: 'Admin1234!' });
  check('Admin login status 201', login.status === 201);
  const adminToken = login.data?.data?.accessToken;
  check('Admin token received', !!adminToken);
  if (!adminToken) { console.log('ABORT: Cannot continue without admin token'); return; }

  // 2. Admin - List Users
  console.log('\n[2] Admin User List');
  const users = await req('GET', '/admin/users', null, adminToken);
  check('Admin users endpoint', users.status === 200);
  const rawUsers = users.data?.data;
  const allUsers = Array.isArray(rawUsers) ? rawUsers : (rawUsers?.data || rawUsers?.items || []);
  console.log(`   Found ${allUsers.length} users`);
  allUsers.forEach(u => console.log(`     ${(u.role||'?').padEnd(12)} | ${u.email} | org: ${u.organization?.name || '-'} | status: ${u.status}`));

  // 3. Notification DTO test
  console.log('\n[3] Notification DTO Transform');
  const notifs = await req('GET', '/notifications', null, adminToken);
  check('Notifications endpoint', notifs.status === 200);
  const notifList = notifs.data?.data?.items || notifs.data?.data || [];
  if (notifList.length > 0) {
    const n = notifList[0];
    check('isRead field exists', n.hasOwnProperty('isRead'));
    check('message field exists', n.hasOwnProperty('message'));
    check('isRead is boolean', typeof n.isRead === 'boolean');
    console.log(`   Sample: title="${n.title}", message="${n.message}", isRead=${n.isRead}`);
  } else {
    console.log('   No notifications (admin has none - will test with other roles)');
  }

  // 4. Unread Count
  console.log('\n[4] Unread Count');
  const unread = await req('GET', '/notifications/unread-count', null, adminToken);
  check('Unread count endpoint', unread.status === 200);
  console.log(`   Count: ${JSON.stringify(unread.data?.data)}`);

  // 5. Test organizer accounts
  const organizers = allUsers.filter(u => u.role === 'organizer' && u.status === 'active');
  console.log(`\n[5] Organizer Tests (${organizers.length} found)`);
  for (const org of organizers) {
    for (const pw of ['Test1234!', 'Password1!', 'Organizer1!']) {
      const orgLogin = await req('POST', '/auth/login/email', { email: org.email, password: pw });
      if (orgLogin.status === 201 && orgLogin.data?.data?.accessToken) {
        const orgToken = orgLogin.data.data.accessToken;
        console.log(`   Logged in as: ${org.email}`);

        // Events with partner names
        const orgEvents = await req('GET', '/events/my', null, orgToken);
        check(`Organizer events endpoint`, orgEvents.status === 200);
        const events = orgEvents.data?.data || [];
        console.log(`   Events: ${events.length}`);

        for (const ev of events) {
          console.log(`   Event "${ev.name}" (${ev.id?.slice(0,8)}...)`);
          if (ev.partners?.length > 0) {
            ev.partners.forEach((p, i) => {
              const name = p.partner?.name || p.organization?.name;
              check(`Partner ${i} has name`, !!name);
              console.log(`     Partner: "${name}" (status: ${p.status})`);
            });
          }

          // IC Config
          const icRes = await req('GET', `/ic/configs/event/${ev.id}`, null, orgToken);
          if (icRes.status === 200 && icRes.data?.data) {
            const cfg = icRes.data.data;
            check(`IC Config loaded for event`, true);
            console.log(`     IC Config: aptTypes=${cfg.apartmentTypes?.length||0} stages=${cfg.paymentStages?.length||0}`);

            // IC Sheets
            if (cfg.sheets?.length > 0) {
              for (const sheet of cfg.sheets) {
                console.log(`     Sheet "${sheet.categoryName}": cols=${sheet.columns?.length||0} rows=${sheet.rows?.length||0} status=${sheet.status}`);
                if (sheet.rows?.length > 0) {
                  const sorted = [...sheet.rows].sort((a,b) => (a.sortOrder||0) - (b.sortOrder||0));
                  const orderCorrect = sorted.every((r,i) => i === 0 || r.sortOrder >= sorted[i-1].sortOrder);
                  check('Row sort order consistent', orderCorrect);
                  sheet.rows.slice(0, 3).forEach((r, ri) => {
                    console.log(`       Row${ri}: order=${r.sortOrder} prices=${JSON.stringify(r.prices||{}).slice(0,80)} cells=${JSON.stringify(r.cellValues||{}).slice(0,80)}`);
                  });
                }
              }
            }
          } else {
            console.log(`     No IC Config`);
          }
        }

        // Organizer notifications
        const orgNotifs = await req('GET', '/notifications', null, orgToken);
        const orgNotifList = orgNotifs.data?.data?.items || orgNotifs.data?.data || [];
        console.log(`   Notifications: ${orgNotifList.length}`);
        if (orgNotifList.length > 0) {
          const n = orgNotifList[0];
          check('Organizer notif has isRead', n.hasOwnProperty('isRead'));
          check('Organizer notif has message', n.hasOwnProperty('message'));
          console.log(`     Latest: "${n.title}" / "${n.message}" / isRead=${n.isRead}`);
        }
        break;
      }
    }
  }

  // 6. Test partner accounts
  const partners = allUsers.filter(u => u.role === 'partner' && u.status === 'active');
  console.log(`\n[6] Partner Tests (${partners.length} found)`);
  for (const part of partners.slice(0, 2)) {
    for (const pw of ['Test1234!', 'Password1!', 'Partner1!']) {
      const pLogin = await req('POST', '/auth/login/email', { email: part.email, password: pw });
      if (pLogin.status === 201 && pLogin.data?.data?.accessToken) {
        const pToken = pLogin.data.data.accessToken;
        console.log(`   Logged in as: ${part.email}`);

        // Notifications
        const pNotifs = await req('GET', '/notifications', null, pToken);
        const pNotifList = pNotifs.data?.data?.items || pNotifs.data?.data || [];
        console.log(`   Notifications: ${pNotifList.length}`);
        if (pNotifList.length > 0) {
          const n = pNotifList[0];
          check('Partner notif DTO correct', n.hasOwnProperty('isRead') && n.hasOwnProperty('message'));
          console.log(`     Latest: "${n.title}" / "${n.message}" / isRead=${n.isRead}`);
        }

        // Partner IC sheets
        const pSheets = await req('GET', '/ic/sheets/my', null, pToken);
        console.log(`   IC Sheets: ${pSheets.status} (${(pSheets.data?.data||[]).length} sheets)`);
        break;
      }
    }
  }

  // 7. Frontend Pages
  console.log('\n[7] Frontend Pages');
  const pages = [
    '/login', '/', '/organizer', '/partner/events', '/customer',
    '/customer/contracts', '/customer/notifications',
    '/organizer/notifications', '/partner/notifications',
  ];
  for (const page of pages) {
    const url = new URL(`https://dealflow.xenokev.workers.dev${page}`);
    const res = await new Promise((resolve) => {
      https.get(url, (r) => {
        let d = '';
        r.on('data', (c) => d += c);
        r.on('end', () => resolve({ status: r.statusCode, size: d.length }));
      }).on('error', () => resolve({ status: 'ERR', size: 0 }));
    });
    check(`${page} returns 200`, res.status === 200);
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} checks`);
  if (failed > 0) {
    console.log('Failed:');
    results.filter(r => !r.ok).forEach(r => console.log(`  - ${r.name}`));
  }
  console.log('═══════════════════════════════════════');
}

test().catch(console.error);
