import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  outboundFetch,
  logNetworkError,
} from '@/lib/outbound-fetch';

const APPROVE_PREFIX = 'approve_';
const REJECT_PREFIX = 'reject_';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string,
  text: string,
  showAlert: boolean
) {
  try {
    await outboundFetch(
      `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
          show_alert: showAlert,
        }),
      }
    );
  } catch (err) {
    logNetworkError(err, 'bot answerCallbackQuery');
  }
}

async function editMessageText(
  botToken: string,
  chatId: string | number,
  messageId: string | number,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
) {
  try {
    await outboundFetch(
      `https://api.telegram.org/bot${botToken}/editMessageText`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: parseMode,
        }),
      }
    );
  } catch (err) {
    logNetworkError(err, 'bot editMessageText');
  }
}

type TelegramUpdate = {
  callback_query?: {
    id: string;
    data?: string;
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
      text?: string;
    };
  };
};

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const cq = update.callback_query;
  if (!cq?.data) {
    console.log('[bot] Received update without callback data');
    return NextResponse.json({ ok: true });
  }

  const { data, id: callbackQueryId } = cq;
  console.log('[bot] Processing callback:', { data, callbackQueryId });

  if (data.startsWith(APPROVE_PREFIX)) {
    const userId = data.slice(APPROVE_PREFIX.length);
    if (!isUuid(userId)) {
      await answerCallbackQuery(botToken, callbackQueryId, 'Invalid ID', true);
      return NextResponse.json({ ok: true });
    }

    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) {
        console.error('Supabase approve error:', error);
        await answerCallbackQuery(
          botToken,
          callbackQueryId,
          'Could not update database',
          true
        );
        return NextResponse.json({ ok: true });
      }

      // Answer the callback query first
      await answerCallbackQuery(botToken, callbackQueryId, 'Approved', false);

      // Edit the original message to remove buttons and show status
      if (cq.message?.message_id && cq.message?.chat?.id) {
        const originalText = cq.message.text || '';
        const updatedText = `${originalText}\n\n✅ <b>Request approved</b>`;
        await editMessageText(
          botToken,
          cq.message.chat.id,
          cq.message.message_id,
          updatedText
        );
      }
    } catch (e) {
      console.error(e);
      await answerCallbackQuery(
        botToken,
        callbackQueryId,
        'Server error',
        true
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (data.startsWith(REJECT_PREFIX)) {
    const userId = data.slice(REJECT_PREFIX.length);
    if (!isUuid(userId)) {
      await answerCallbackQuery(botToken, callbackQueryId, 'Invalid ID', true);
      return NextResponse.json({ ok: true });
    }

    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', userId);

      if (error) {
        console.error('Supabase reject error:', error);
        await answerCallbackQuery(
          botToken,
          callbackQueryId,
          'Could not update database',
          true
        );
        return NextResponse.json({ ok: true });
      }

      // Answer the callback query first
      await answerCallbackQuery(botToken, callbackQueryId, 'Rejected', false);

      // Edit the original message to remove buttons and show status
      if (cq.message?.message_id && cq.message?.chat?.id) {
        const originalText = cq.message.text || '';
        const updatedText = `${originalText}\n\n❌ <b>Request rejected</b>`;
        await editMessageText(
          botToken,
          cq.message.chat.id,
          cq.message.message_id,
          updatedText
        );
      }
    } catch (e) {
      console.error(e);
      await answerCallbackQuery(
        botToken,
        callbackQueryId,
        'Server error',
        true
      );
    }
    return NextResponse.json({ ok: true });
  }

  await answerCallbackQuery(botToken, callbackQueryId, 'Unknown action', false);
  return NextResponse.json({ ok: true });
}
