/**
 * Server-side outbound HTTP. If `TELEGRAM_OUTBOUND_PROXY`, `HTTPS_PROXY`, or `HTTP_PROXY`
 * is set (e.g. `http://127.0.0.1:7890` for a local VPN client), requests go through that proxy.
 *
 * Always use the official Bot API host `https://api.telegram.org` — never send your bot token
 * to unofficial "mirror" domains.
 */
import fetchNode from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export function getOutboundProxyUrl(): string | null {
  const p =
    process.env.TELEGRAM_OUTBOUND_PROXY?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.HTTP_PROXY?.trim() ||
    '';
  return p || null;
}

export function logNetworkError(err: unknown, label: string) {
  console.error(`[${label}] network error (full object + cause chain):`);
  console.error(err);
  if (!(err instanceof Error)) return;

  const e0 = err as NodeJS.ErrnoException;
  console.error('  name:', err.name);
  console.error('  message:', err.message);
  if (e0.code) {
    console.error(
      '  code:',
      e0.code,
      '(e.g. ECONNREFUSED, ETIMEDOUT, ENOTFOUND, EAI_AGAIN)'
    );
  }
  if (e0.errno != null) console.error('  errno:', e0.errno);
  if (e0.syscall) console.error('  syscall:', e0.syscall);

  let depth = 0;
  let c: unknown = e0.cause;
  while (c != null && depth < 10) {
    console.error(`  cause[${depth}]:`, c);
    if (c instanceof Error) {
      const e = c as NodeJS.ErrnoException;
      console.error('    message:', e.message);
      if (e.code) console.error('    code:', e.code);
      if (e.errno != null) console.error('    errno:', e.errno);
      if (e.syscall) console.error('    syscall:', e.syscall);
      c = e.cause;
    } else {
      break;
    }
    depth++;
  }
}

export function summarizeNetworkError(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as NodeJS.ErrnoException).code;
    return [err.message, code ? `code=${code}` : null].filter(Boolean).join(' | ');
  }
  return String(err);
}

export type OutboundResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export async function outboundFetch(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<OutboundResponse> {
  const proxy = getOutboundProxyUrl();
  if (proxy) {
    console.log(
      '[outbound-fetch] proxy enabled (set via TELEGRAM_OUTBOUND_PROXY, HTTPS_PROXY, or HTTP_PROXY)'
    );
  }

  if (proxy) {
    const agent = new HttpsProxyAgent(proxy);
    const res = await fetchNode(url, {
      method: init.method ?? 'GET',
      headers: init.headers,
      body: init.body,
      agent,
    });
    return {
      ok: res.ok,
      status: res.status,
      json: () => res.json(),
    };
  }

  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: init.headers,
    body: init.body,
  });
  return {
    ok: res.ok,
    status: res.status,
    json: () => res.json(),
  };
}
