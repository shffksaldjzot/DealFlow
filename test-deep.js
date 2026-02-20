const https = require('https');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://dealflow-api-tyz1.onrender.com/api' + path);
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

async function main() {
  console.log('=== Deep Integration Test ===\n');

  // Admin login
  const login = await req('POST', '/auth/login/email', { email: 'admin@dealflow.com', password: 'Admin1234!' });
  const adminToken = login.data.data.accessToken;
  console.log('[Admin] Logged in');

  // Get all users
  const users = await req('GET', '/admin/users', null, adminToken);
  const rawData = users.data?.data;
  const allUsers = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.items || []);

  const org = allUsers.find(u => u.email === 'moida09@moida09.com');
  if (!org) { console.log('No organizer found'); return; }

  // Reset organizer password
  console.log('[Admin] Resetting organizer password:', org.email);
  const resetRes = await req('POST', `/admin/users/${org.id}/reset-password`, { newPassword: 'Test1234!' }, adminToken);
  console.log('  Reset result:', resetRes.status);

  // Login as organizer
  const orgLogin = await req('POST', '/auth/login/email', { email: org.email, password: 'Test1234!' });
  if (orgLogin.status !== 201) {
    console.log('  Organizer login failed:', orgLogin.status, JSON.stringify(orgLogin.data).slice(0, 200));
    return;
  }
  const orgToken = orgLogin.data.data.accessToken;
  console.log('[Organizer] Logged in as', org.email);

  // Test: Events with partner names
  console.log('\n--- Events & Partner Names ---');
  const eventsRes = await req('GET', '/events/my', null, orgToken);
  const events = eventsRes.data?.data || [];
  console.log(`Events: ${events.length}`);

  for (const ev of events) {
    console.log(`\n  Event: "${ev.name}" (${ev.id.slice(0, 8)}...)`);
    console.log(`  Partners: ${ev.partners?.length || 0}`);
    if (ev.partners?.length > 0) {
      ev.partners.forEach((p, i) => {
        const name = p.partner?.name || p.organization?.name;
        const status = name ? 'PASS' : 'FAIL - name missing';
        console.log(`    [${i}] name="${name || 'null'}" status=${p.status} → ${status}`);
      });
    }

    // IC Config
    const icRes = await req('GET', `/ic/configs/event/${ev.id}`, null, orgToken);
    if (icRes.status === 200 && icRes.data?.data) {
      const cfg = icRes.data.data;
      console.log(`  IC Config: aptTypes=${cfg.apartmentTypes?.length || 0}, stages=${cfg.paymentStages?.length || 0}`);

      if (cfg.sheets?.length > 0) {
        for (const sheet of cfg.sheets) {
          console.log(`    Sheet "${sheet.categoryName}": cols=${sheet.columns?.length || 0}, rows=${sheet.rows?.length || 0}, status=${sheet.status}`);
          if (sheet.rows?.length > 0) {
            sheet.rows.forEach((r, ri) => {
              const hasPrices = Object.keys(r.prices || {}).length > 0;
              const hasCells = Object.keys(r.cellValues || {}).length > 0;
              console.log(`      Row${ri}: sortOrder=${r.sortOrder}, hasPrices=${hasPrices}, hasCells=${hasCells}`);
              if (hasPrices) console.log(`        prices: ${JSON.stringify(r.prices).slice(0, 120)}`);
              if (hasCells) console.log(`        cells: ${JSON.stringify(r.cellValues).slice(0, 120)}`);
            });
          }
        }
      }
    } else {
      console.log(`  No IC Config`);
    }
  }

  // Organizer notifications
  console.log('\n--- Organizer Notifications ---');
  const orgNotifs = await req('GET', '/notifications', null, orgToken);
  const orgNotifList = orgNotifs.data?.data || [];
  console.log(`Count: ${orgNotifList.length}`);
  orgNotifList.slice(0, 5).forEach((n, i) => {
    console.log(`  [${i}] title="${n.title}" message="${n.message}" isRead=${n.isRead} relatedType=${n.relatedType || 'null'}`);
    const dtoOk = n.hasOwnProperty('isRead') && n.hasOwnProperty('message');
    console.log(`       DTO fields: ${dtoOk ? 'PASS' : 'FAIL'}`);
  });

  const orgUnread = await req('GET', '/notifications/unread-count', null, orgToken);
  console.log(`Unread count: ${JSON.stringify(orgUnread.data?.data)}`);

  // Test partner
  const partnerUser = allUsers.find(u => u.role === 'partner');
  if (partnerUser) {
    console.log('\n--- Partner Test ---');
    console.log(`Resetting password for: ${partnerUser.email}`);
    await req('POST', `/admin/users/${partnerUser.id}/reset-password`, { newPassword: 'Test1234!' }, adminToken);

    const pLogin = await req('POST', '/auth/login/email', { email: partnerUser.email, password: 'Test1234!' });
    if (pLogin.status === 201) {
      const pToken = pLogin.data.data.accessToken;
      console.log(`[Partner] Logged in as ${partnerUser.email}`);

      // Partner notifications
      const pNotifs = await req('GET', '/notifications', null, pToken);
      const pList = pNotifs.data?.data || [];
      console.log(`Notifications: ${pList.length}`);
      pList.slice(0, 3).forEach((n, i) => {
        console.log(`  [${i}] title="${n.title}" message="${n.message}" isRead=${n.isRead}`);
        console.log(`       DTO: ${n.hasOwnProperty('isRead') && n.hasOwnProperty('message') ? 'PASS' : 'FAIL'}`);
      });

      // Partner sheets
      const pSheets = await req('GET', '/ic/sheets/my', null, pToken);
      console.log(`IC Sheets: ${(pSheets.data?.data || []).length}`);
      (pSheets.data?.data || []).forEach((s, i) => {
        console.log(`  [${i}] "${s.categoryName}" cols=${s.columns?.length || 0} rows=${s.rows?.length || 0} status=${s.status}`);
      });
    }
  }

  console.log('\n=== Deep Test Complete ===');
}

main().catch(console.error);
