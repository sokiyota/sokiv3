/**
 * Env (`.env.local` in project root — restart `npm run dev` after edits):
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_ADMIN_CHAT_ID
 * - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (admin insert)
 *
 * Optional proxy (VPN / local proxy, e.g. Clash HTTP port):
 * - TELEGRAM_OUTBOUND_PROXY (preferred for this app), or HTTPS_PROXY / HTTP_PROXY
 *   Example: http://127.0.0.1:7890
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { escapeHtml } from '@/lib/escape-html';
import {
  outboundFetch,
  logNetworkError,
  summarizeNetworkError,
} from '@/lib/outbound-fetch';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
    const story = typeof body.story === 'string' ? body.story.trim() : '';
    const experience =
      typeof body.experience === 'string' ? body.experience.trim() : '';
    const role = typeof body.role === 'string' ? body.role.trim() : '';

    if (!contact || !story) {
      return NextResponse.json({ error: 'contact and story are required' }, { status: 400 });
    }

    const rawToken = process.env.TELEGRAM_BOT_TOKEN;
    const rawChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const botToken = rawToken?.trim();
    const chatId = rawChatId?.trim();

    // Temporary diagnostics (no secret values). Remove after debugging.
    console.log('[send-request] Telegram env visibility:', {
      TELEGRAM_BOT_TOKEN: rawToken
        ? `set, length=${rawToken.length} (after trim: ${botToken?.length ?? 0})`
        : 'NOT SET (undefined or empty)',
      TELEGRAM_ADMIN_CHAT_ID: rawChatId
        ? `set, length=${rawChatId.length} (after trim: ${chatId?.length ?? 0})`
        : 'NOT SET (undefined or empty)',
    });

    const missingTelegram: string[] = [];
    if (!botToken) missingTelegram.push('TELEGRAM_BOT_TOKEN');
    if (!chatId) missingTelegram.push('TELEGRAM_ADMIN_CHAT_ID');

    if (missingTelegram.length > 0) {
      return NextResponse.json(
        {
          error: 'Telegram env is not configured',
          missing: missingTelegram,
          details: `Add to .env.local in the project root (exact names): ${missingTelegram.join(', ')}. Restart \`npm run dev\` after saving.`,
        },
        { status: 500 }
      );
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[send-request] Supabase admin:', msg);
      return NextResponse.json(
        {
          error: 'Supabase admin client is not configured',
          details: msg,
        },
        { status: 500 }
      );
    }

    console.log('[send-request] Attempting to insert into profiles table:', {
      contact: contact.substring(0, 50) + (contact.length > 50 ? '...' : ''),
      story: story.substring(0, 50) + (story.length > 50 ? '...' : ''),
      experience: experience ? experience.substring(0, 50) + (experience.length > 50 ? '...' : '') : null,
      role: role ? role.substring(0, 50) + (role.length > 50 ? '...' : '') : null,
    });

    const { data: row, error: insertError } = await supabase
      .from('profiles')
      .insert({
        contact,
        story,
        experience: experience || null,
        role: role || null,
        is_approved: false,
      })
      .select('id')
      .single();

    if (insertError || !row?.id) {
      console.error('[send-request] Supabase insert error:', {
        error: insertError,
        message: insertError?.message,
        code: insertError?.code,
        details: insertError?.details,
        hint: insertError?.hint
      });
      return NextResponse.json(
        { 
          error: 'Failed to save request to database', 
          step: 'database_insert',
          details: insertError?.message || 'Unknown database error',
          code: insertError?.code,
          hint: insertError?.hint
        },
        { status: 500 }
      );
    }

    const userId = row.id as string;

    const safeContact = escapeHtml(contact);
    const safeStory = escapeHtml(story);
    const safeExperience = escapeHtml(experience);
    const safeRole = escapeHtml(role);

    const message = `
<b>📩 New sokiwrld access request</b>
<b>ID:</b> <code>${userId}</code>
<b>👤 Contact:</b> ${safeContact}
${experience ? `<b>🎮 Experience:</b> ${safeExperience}\n` : ''}${role ? `<b>🛠 Role:</b> ${safeRole}\n` : ''}<b>📝 Story:</b> ${safeStory}
`.trim();

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    console.log('[send-request] Attempting to send Telegram message:', {
      url: `https://api.telegram.org/bot${botToken?.substring(0, 10)}.../sendMessage`,
      chatId: chatId,
      messageLength: message.length
    });

    let response;
    try {
      response = await outboundFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Approve',
                  callback_data: `approve_${userId}`,
                },
                {
                  text: '❌ Reject',
                  callback_data: `reject_${userId}`,
                },
              ],
            ],
          },
        }),
      });
    } catch (err) {
      console.error('[send-request] Telegram network error:', err);
      logNetworkError(err, 'send-request Telegram sendMessage');
      return NextResponse.json(
        {
          error: 'Failed to reach Telegram API (network)',
          step: 'telegram_network',
          details: summarizeNetworkError(err),
          url: `https://api.telegram.org/bot${botToken?.substring(0, 10)}.../sendMessage`,
          chatId: chatId
        },
        { status: 502 }
      );
    }

    console.log('[send-request] Telegram response status:', response.status, 'ok:', response.ok);

    let tgPayload;
    try {
      tgPayload = (await response.json()) as {
        ok?: boolean;
        description?: string;
        error_code?: number;
      };
    } catch (parseErr) {
      console.error('[send-request] Failed to parse Telegram response:', parseErr);
      return NextResponse.json(
        {
          error: 'Invalid response from Telegram API',
          step: 'telegram_parse',
          details: parseErr instanceof Error ? parseErr.message : String(parseErr),
          status: response.status
        },
        { status: 502 }
      );
    }

    console.log('[send-request] Telegram payload:', tgPayload);

    // Telegram often returns HTTP 200 with { ok: false, description: "..." }
    if (!response.ok || tgPayload.ok === false) {
      console.error('[send-request] Telegram API error:', {
        status: response.status,
        payload: tgPayload
      });
      return NextResponse.json(
        {
          error: 'Telegram API returned error',
          step: 'telegram_api',
          details: tgPayload.description || "Unknown Telegram API error",
          error_code: tgPayload.error_code,
          status: response.status,
          ok: tgPayload.ok
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, id: userId });
  } catch (error) {
    logNetworkError(error, 'send-request (unexpected)');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
