/**
 * Checks HTTPS reachability to telegram.org and api.telegram.org (no curl required).
 * Run: node scripts/check-telegram.mjs
 */
import https from 'node:https';

function head(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { method: 'HEAD', timeout: 15_000 },
      (res) => {
        res.resume();
        resolve({ url, status: res.statusCode });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.end();
  });
}

const urls = ['https://telegram.org', 'https://api.telegram.org'];

for (const u of urls) {
  try {
    const r = await head(u);
    console.log(`${u} -> HTTP ${r.status}`);
  } catch (e) {
    console.error(`${u} -> FAILED`, e?.message || e);
  }
}
