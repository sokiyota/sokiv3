/**
 * Checks .env.local next to package.json (run from project root: npm run env:check).
 * Does not print secret values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');

console.log('Project root:', root);
console.log('Expected .env.local:', envPath);
console.log('package.json here:', fs.existsSync(path.join(root, 'package.json')));

if (!fs.existsSync(envPath)) {
  console.log('\n❌ .env.local NOT FOUND at project root.');
  console.log('   Create E:\\sokiwrld33\\.env.local (same folder as package.json), not inside app/.');
  process.exit(1);
}

const buf = fs.readFileSync(envPath);
const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
const text = buf.toString('utf8');
if (hasBom) {
  console.log('\n⚠️  UTF-8 BOM detected at start of file. Prefer saving as UTF-8 without BOM.');
}

const keys = new Set();
for (const line of text.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
  if (m) keys.add(m[1]);
  else if (trimmed.includes('=')) {
    console.log('⚠️  Line may be malformed (leading spaces or bad key):', trimmed.slice(0, 40) + '…');
  }
}

const need = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID'];
console.log('\nDeclared keys (names only):');
for (const k of need) {
  console.log(`  ${k}: ${keys.has(k) ? '✓ line found' : '✗ MISSING'}`);
}

const wrongName = ['.env.local.txt', 'env.local', '.env.local '];
for (const w of wrongName) {
  const p = path.join(root, w);
  if (fs.existsSync(p) && w !== '.env.local') {
    console.log(`\n⚠️  Also found: ${w} — Next.js only auto-loads .env.local`);
  }
}

console.log('\nNext: stop dev server, run: npm run dev:clean (or delete .folder .next), then npm run dev');
