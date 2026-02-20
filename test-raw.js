const https = require('https');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://dealflow-api-tyz1.onrender.com/api' + path);
    const options = { hostname: url.hostname, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json' } };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    const r = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  // Login as admin first
  const adminRaw = await req('POST', '/auth/login/email', { email: 'admin@dealflow.com', password: 'Admin1234!' });
  const admin = JSON.parse(adminRaw);
  const adminToken = admin.data.accessToken;

  // Reset organizer password
  const users = JSON.parse(await req('GET', '/admin/users', null, adminToken));
  const allUsers = Array.isArray(users.data) ? users.data : (users.data?.data || []);
  const org = allUsers.find(u => u.email === 'moida09@moida09.com');
  await req('POST', `/admin/users/${org.id}/reset-password`, { newPassword: 'Test1234!' }, adminToken);

  // Login as organizer
  const orgRaw = await req('POST', '/auth/login/email', { email: 'moida09@moida09.com', password: 'Test1234!' });
  const orgLogin = JSON.parse(orgRaw);
  const orgToken = orgLogin.data.accessToken;

  // Get RAW notification response
  const notifsRaw = await req('GET', '/notifications', null, orgToken);
  console.log('=== RAW Notifications Response ===');
  console.log(notifsRaw.slice(0, 2000));

  // Parse and check structure
  const parsed = JSON.parse(notifsRaw);
  console.log('\n=== Parsed Structure ===');
  console.log('Top keys:', Object.keys(parsed));
  console.log('data type:', typeof parsed.data);
  if (Array.isArray(parsed.data)) {
    console.log('data is array, length:', parsed.data.length);
    if (parsed.data.length > 0) {
      console.log('First item keys:', Object.keys(parsed.data[0]));
      console.log('First item:', JSON.stringify(parsed.data[0], null, 2));
    }
  } else if (parsed.data && typeof parsed.data === 'object') {
    console.log('data keys:', Object.keys(parsed.data));
    if (Array.isArray(parsed.data.data)) {
      console.log('data.data is array, length:', parsed.data.data.length);
    }
  }
}

main().catch(console.error);
