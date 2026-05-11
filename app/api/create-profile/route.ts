import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { contact, story, role, experience, userId, background, motivation } = await req.json()

    if (!contact || !story || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: contact, story, userId' },
        { status: 400 }
      )
    }

    // Create profile in database linked to auth user
    const supabase = createAdminClient()
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId, // Link to auth user
        contact,
        story: background || story, // Use background as story if provided
        role: role || null,
        experience: experience || null,
        is_approved: false, // Default to not approved
        soki_balance: 0, // Initialize with 0 points
      })
      .select('id')
      .single()

    if (insertError || !profile?.id) {
      console.error('Profile creation error:', insertError)
      return NextResponse.json(
        { 
          error: 'Failed to create profile', 
          details: insertError?.message 
        },
        { status: 500 }
      )
    }

    // Send notification to Telegram for approval
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
      const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim()

      if (botToken && chatId) {
        const message = `
<b>📩 SOKIWRLD Application</b>

<b>👤 Applicant:</b> ${contact}
<b>🎮 Role:</b> ${role || 'Not specified'}
<b>💼 Background:</b>
${background || 'Not provided'}

${experience ? `<b>⚡ Experience:</b>\n${experience}` : ''}

<b>🎯 Motivation:</b>
${motivation || 'Not provided'}

<b>🔑 User ID:</b> <code>${profile.id}</code>
`.trim()

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
                    callback_data: `approve_${profile.id}`,
                  },
                  {
                    text: '❌ Reject',
                    callback_data: `reject_${profile.id}`,
                  },
                ],
              ],
            },
          }),
        })

        if (!response.ok) {
          console.error('Failed to send Telegram notification:', await response.text())
        }
      }
    } catch (tgError) {
      console.error('Telegram notification error:', tgError)
      // Don't fail the whole request if Telegram fails
    }

    return NextResponse.json({ 
      success: true, 
      id: profile.id 
    })

  } catch (error) {
    console.error('Create profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
